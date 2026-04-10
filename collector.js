const https = require('https');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase 초기화
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

/* ═══════════════════════════════════════════════════════
   설정
═══════════════════════════════════════════════════════ */
const BLUESTACKS_BASE = 'https://www.bluestacks.com';
const TOTAL_PAGES = 11;
const DELAY_MS = 1500;
const YEAR = new Date().getFullYear();

// 국내 인기 게임 순위 (구글플레이 매출 기반)
const GAME_RANK = {
  '리니지M': 1, '리니지W': 2, '리니지2M': 3,
  '오딘: 발할라 라이징': 4, '로스트아크': 5,
  '메이플스토리M': 6, '던전앤파이터M': 7,
  '블루 아카이브': 8, '에픽세븐': 9,
  '검은사막 모바일': 10, '나이트 크로우': 11,
  '쿠키런: 킹덤': 12, '마비노기 모바일': 13,
  '아이온2': 14, '원신': 15,
  '붕괴: 스타레일': 16, '젠레스 존 제로': 17,
  '나 혼자만 레벨업: ARISE': 18,
  '트릭컬 RE:VIVE': 19, '명조: 워더링 웨이브': 20,
  '배틀그라운드 모바일': 21,
  '라그나로크 오리진': 22, '라그나로크 오리진 클래식': 23,
  '브롤스타즈': 24, '클래시 오브 클랜': 25,
  '포켓몬 카드 게임 Pocket': 26,
};

/* ═══════════════════════════════════════════════════════
   유틸: HTTP fetch (외부 패키지 없음 — node 내장만 사용)
═══════════════════════════════════════════════════════ */
function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('too many redirects'));
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    }, (res) => {
      if ([301,302,303,307].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : BLUESTACKS_BASE + res.headers.location;
        return fetchUrl(next, redirectCount + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

/* ═══════════════════════════════════════════════════════
   Step 1: 블루스택 목록 페이지에서 게임 목록 수집
   반환: [{ slug, couponUrl, appPageUrl }]
═══════════════════════════════════════════════════════ */
async function collectGameList() {
  console.log('📋 블루스택 게임 목록 수집 중...\n');
  const games = [];
  const seen = new Set();

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = page === 1
      ? `${BLUESTACKS_BASE}/ko/blog/redeem-codes.html`
      : `${BLUESTACKS_BASE}/ko/blog/redeem-codes/page/${page}.html`;

    try {
      const html = await fetchUrl(url);

      // 쿠폰 페이지 링크: /ko/blog/redeem-codes/XXX-redeem-codes-ko.html
      const re = /href="(\/ko\/blog\/redeem-codes\/([^"]+)-redeem-codes-ko\.html)"/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        const path = m[1];
        const slug = m[2];
        if (seen.has(path)) continue;
        seen.add(path);
        games.push({ slug, couponUrl: BLUESTACKS_BASE + path });
      }
      console.log(`  페이지 ${page}/${TOTAL_PAGES} → 누적 ${games.length}개`);
    } catch (e) {
      console.log(`  ⚠️ 페이지 ${page} 실패: ${e.message}`);
    }
    await delay(DELAY_MS);
  }

  console.log(`\n✅ 총 ${games.length}개 게임 URL 수집 완료\n`);
  return games;
}

/* ═══════════════════════════════════════════════════════
   Step 2: 쿠폰 페이지에서 쿠폰코드 + 앱페이지 URL 파싱
═══════════════════════════════════════════════════════ */
function parseCouponPage(html, slug) {
  // ── 게임명 추출
  const h1 = (html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/) || [])[1] || slug;
  const gameName = h1
    .replace(/공략\s*[-–]\s*최신.*/i, '')
    .replace(/사용 가능한 모든 쿠폰 코드.*/i, '')
    .replace(/\d{4}년.*/,'')
    .replace(/쿠폰 코드.*/i,'')
    .replace(/교환 코드.*/i,'')
    .trim();

  // ── 앱 페이지 링크 추출 (이미지 + 패키지명 있는 페이지)
  // 예: /ko/apps/role-playing/ragnarok-origin-classic-on-pc.html
  const appPageMatch = html.match(/href="(\/ko\/apps\/[^"]+on-pc\.html)"/);
  const appPageUrl = appPageMatch ? BLUESTACKS_BASE + appPageMatch[1] : null;

  // ── 쿠폰 테이블 파싱
  const coupons = [];

  // 방법1: <tr><td><strong>CODE</strong></td><td>보상</td></tr>
  const tableRe = /<tr[^>]*>[\s\S]*?<td[^>]*>\s*<strong>\s*([A-Z0-9가-힣_\-]{3,30})\s*<\/strong>\s*<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = tableRe.exec(html)) !== null) {
    const code = m[1].trim();
    const reward = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g,' ').trim();
    if (code && !/^\d+$/.test(code)) coupons.push({ code, reward });
  }

  // 방법2: 굵은 글씨 코드 (테이블 없을 때)
  if (coupons.length === 0) {
    const boldRe = /<strong>\s*([A-Z0-9]{4,25})\s*<\/strong>/g;
    while ((m = boldRe.exec(html)) !== null) {
      const code = m[1].trim();
      if (!/^\d+$/.test(code)) coupons.push({ code, reward: '인게임 보상' });
    }
  }

  // ── 만료일 추출
  const expMatch = html.match(/(\d{4})[년.\-](\d{1,2})[월.\-](\d{1,2})/);
  const today = new Date();
  let expire = '무기한';
  if (expMatch) {
    const d = new Date(expMatch[1], expMatch[2]-1, expMatch[3]);
    if (d > today) {
      expire = `${expMatch[1]}.${String(expMatch[2]).padStart(2,'0')}.${String(expMatch[3]).padStart(2,'0')}`;
    }
  }

  // ── 장르 추출
  const genreMap = { '롤플레잉':'rpg','RPG':'rpg','MMORPG':'rpg','액션':'action','전략':'strategy','캐주얼':'casual','아케이드':'casual','카드':'casual','FPS':'fps' };
  let genre = 'rpg';
  for (const [k,v] of Object.entries(genreMap)) {
    if (html.includes(k)) { genre = v; break; }
  }

  return { gameName, appPageUrl, coupons, expire, genre };
}

/* ═══════════════════════════════════════════════════════
   Step 3: 앱 페이지에서 이미지 URL + 패키지명 추출
═══════════════════════════════════════════════════════ */
async function fetchGameImage(appPageUrl) {
  if (!appPageUrl) return { imageUrl: null, packageName: null };
  try {
    const html = await fetchUrl(appPageUrl);

    // 패키지명 추출: app_pkg=com.xxxxx.yyyy
    const pkgMatch = html.match(/app_pkg=([a-z][a-z0-9._]+)/i);
    const packageName = pkgMatch ? pkgMatch[1] : null;

    // 아이콘 이미지: cdn-icon.bluestacks.com
    const iconMatch = html.match(/src="(https:\/\/cdn-icon\.bluestacks\.com\/[^"]+)"/);
    let imageUrl = iconMatch ? iconMatch[1] : null;

    // 아이콘 없으면 Google Play 아이콘으로 폴백
    if (!imageUrl && packageName) {
      // iTunes API로 폴백 (Google Play는 CORS 이슈)
      imageUrl = `https://play-lh.googleusercontent.com/search?q=${packageName}`;
    }

    return { imageUrl, packageName };
  } catch (e) {
    return { imageUrl: null, packageName: null };
  }
}

/* ═══════════════════════════════════════════════════════
   iTunes API로 이미지 폴백 (패키지명 없을 때)
═══════════════════════════════════════════════════════ */
function fetchItunesImage(gameName) {
  return new Promise((resolve) => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(gameName)}&country=kr&media=software&limit=1`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const img = j.results?.[0]?.artworkUrl100?.replace('100x100bb','200x200bb') || null;
          resolve(img);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null))
      .setTimeout(5000, function() { this.destroy(); resolve(null); });
  });
}

/* ═══════════════════════════════════════════════════════
   Step 4: Firebase 저장
═══════════════════════════════════════════════════════ */
async function saveToDB(coupons) {
  if (!coupons.length) return;
  // 배치 500개 제한 처리
  for (let i = 0; i < coupons.length; i += 400) {
    const batch = db.batch();
    for (const c of coupons.slice(i, i+400)) {
      const id = `${c.game}_${c.code}`.replace(/[^a-zA-Z0-9가-힣_-]/g,'_');
      batch.set(db.collection('coupons').doc(id), c, { merge: true });
    }
    await batch.commit();
  }
  console.log(`  💾 ${coupons.length}개 저장 완료`);
}

/* ═══════════════════════════════════════════════════════
   Step 5: 만료 쿠폰 정리
   - 만료일 지난 것: 즉시 삭제
   - 만료일 없는 것: 30일 후 삭제
═══════════════════════════════════════════════════════ */
async function cleanCoupons() {
  console.log('🧹 만료 쿠폰 정리 중...');
  try {
    const snap = await db.collection('coupons').get();
    const today = new Date();
    const batches = [db.batch()];
    let idx = 0, cnt = 0, expired = 0, old = 0;

    snap.forEach(doc => {
      const d = doc.data();
      let shouldDelete = false;

      if (d.expire && d.expire !== '무기한') {
        const parts = d.expire.split('.');
        if (parts.length === 3) {
          const exp = new Date(parts[0], parts[1]-1, parts[2]);
          if ((today - exp) / 86400000 > 1) { shouldDelete = true; expired++; }
        }
      } else if (d.expire === '무기한' && d.createdAt) {
        const created = new Date(d.createdAt);
        if ((today - created) / 86400000 > 30) { shouldDelete = true; old++; }
      }

      if (shouldDelete) {
        if (cnt > 0 && cnt % 400 === 0) { batches.push(db.batch()); idx++; }
        batches[idx].delete(doc.ref);
        cnt++;
      }
    });

    if (cnt > 0) {
      for (const b of batches) await b.commit();
      console.log(`  🗑️ 만료 ${expired}개 + 오래된 ${old}개 삭제\n`);
    } else {
      console.log('  ✅ 삭제할 쿠폰 없음\n');
    }
  } catch (e) {
    console.log('  ⚠️ 정리 실패:', e.message, '\n');
  }
}

/* ═══════════════════════════════════════════════════════
   메인
═══════════════════════════════════════════════════════ */
async function main() {
  const startTime = Date.now();
  console.log('🚀 쿠폰던전 자동수집 시작!');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}`);
  console.log('💰 Claude API 비용: 0원 (블루스택 직접 크롤링)\n');

  // 0) 만료 쿠폰 먼저 정리
  await cleanCoupons();

  // 1) 게임 목록 수집
  const gameList = await collectGameList();

  // 2) 각 게임 처리
  console.log(`🎮 게임별 쿠폰 + 이미지 수집 시작\n`);
  const allCoupons = [];
  let success = 0, empty = 0, fail = 0;

  for (const game of gameList) {
    try {
      // 쿠폰 페이지 크롤링
      const html = await fetchUrl(game.couponUrl);
      const { gameName, appPageUrl, coupons, expire, genre } = parseCouponPage(html, game.slug);

      if (coupons.length === 0) {
        process.stdout.write(`  ⬜ ${gameName}: 쿠폰 없음\n`);
        empty++;
        await delay(DELAY_MS);
        continue;
      }

      // 이미지 수집 (앱 페이지 → iTunes 순으로 시도)
      let imageUrl = null;
      let packageName = null;

      if (appPageUrl) {
        const appInfo = await fetchGameImage(appPageUrl);
        imageUrl = appInfo.imageUrl;
        packageName = appInfo.packageName;
        await delay(800);
      }

      // 블루스택 아이콘 없으면 iTunes로 폴백
      if (!imageUrl) {
        imageUrl = await fetchItunesImage(gameName);
      }

      const rank = GAME_RANK[gameName] || 500;

      const formatted = coupons
        .filter(c => c.code && c.code.length >= 3 && !/^\d+$/.test(c.code))
        .map(c => ({
          code:        c.code.toUpperCase(),
          reward:      c.reward || '인게임 보상',
          expire:      expire,
          source:      '블루스택',
          game:        gameName,
          genre:       genre,
          rank:        rank,
          imageUrl:    imageUrl,      // ← 이미지 URL 저장
          packageName: packageName,   // ← 패키지명 저장
          status:      'new',
          views:       Math.floor(Math.random() * 800) + 100,
          votes:       { ok: 0, bad: 0 },
          createdAt:   new Date().toISOString(),
          updatedAt:   new Date().toISOString(),
        }));

      allCoupons.push(...formatted);
      console.log(`  ✅ ${gameName}: ${formatted.length}개 쿠폰 | 이미지: ${imageUrl ? '✓' : '✗'} | 순위: #${rank}`);
      success++;

    } catch (e) {
      console.log(`  ❌ ${game.slug}: ${e.message}`);
      fail++;
    }
    await delay(DELAY_MS);
  }

  // 3) 일괄 저장
  console.log(`\n💾 Firebase 저장 중... (총 ${allCoupons.length}개 쿠폰)`);
  await saveToDB(allCoupons);

  // 4) 결과 요약
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  console.log('\n══════════════════════════════════════');
  console.log(`✅ 완료! 소요시간: ${min}분 ${sec}초`);
  console.log(`  게임 성공: ${success}개 | 빈 페이지: ${empty}개 | 실패: ${fail}개`);
  console.log(`  저장된 쿠폰: ${allCoupons.length}개`);
  console.log(`  이미지 수집: ${allCoupons.filter(c=>c.imageUrl).length}개`);
  console.log('══════════════════════════════════════');
}

main().catch(console.error);
