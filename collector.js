const https = require('https');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const BLUESTACKS_BASE = 'https://www.bluestacks.com';
const TOTAL_PAGES = 11;
const DELAY_MS = 1500;

/* ═══════════════════════════════════════════════════════
   슬러그 → 한글 게임명 매핑
═══════════════════════════════════════════════════════ */
const SLUG_TO_KO = {
  'ragnarok-origin-classic':              '라그나로크 오리진 클래식',
  'ragnarok-origin':                      '라그나로크 오리진',
  'last-z-survival-shooter':             'Last Z: 서바이벌 슈터',
  'dragon-traveler':                      '그놈은 드래곤',
  'the-battle-cats':                      '냥코 대전쟁',
  'lucky-defense':                        '운빨존많겜',
  'jujutsu-kaisen-phantom-parade':        '주술회전 팬텀 퍼레이드',
  'cookierun-ovensmash':                  '쿠키런: 오븐스매시',
  'dx-the-awakened':                      'DX: 각성자들',
  'zombie-high-school':                   '좀비고등학교',
  'the-seven-deadly-sins-origin':         '일곱 개의 대죄: Origin',
  'wow-adventurers':                      '우와 모험단',
  'wuthering-waves':                      '명조: 워더링 웨이브',
  'mongil-star-dive':                     '몬길: STAR DIVE',
  'arknights-endfield':                   '명일방주: 엔드필드',
  'top-heroes':                           '탑 히어로즈',
  'cookierun':                            '쿠키런',
  'cookierun-tower-of-adventures':        '쿠키런: 모험의 탑',
  'whiteout-survival':                    'WOS: 화이트아웃 서바이벌',
  'where-winds-meet':                     '연운',
  'raid-shadow-legends':                  '레이드: 그림자의 전설',
  'pokemon-tcg-pocket':                   '포켓몬 카드 게임 Pocket',
  'stella-sora':                          '스텔라 소라',
  'the-return-of-the-king':               '열혈강호: 귀환',
  'once-human':                           'Once Human',
  'vampir':                               '뱀피르',
  'timeless-isle-latale':                 '라테일 플러스',
  'seven-knights-re-birth':               '세븐 나이츠 리버스',
  'sword-of-justice':                     '역수한',
  'legend-of-mir-2-red-knight':           '미르2: 레드나이트',
  'mafia-mobile':                         '마피아 모바일',
  'maplestory-m':                         '메이플스토리M',
  'solo-leveling-arise':                  '나 혼자만 레벨업: ARISE',
  'persona-phantom-of-the-night':         '페르소나: 팬텀 오브 더 나이트',
  'dark-war-survival':                    '다크워: 서바이벌',
  'tree-of-savior-new-world':             '트리 오브 세이비어: 뉴월드',
  'delta-force':                          '델타포스',
  'soul-idle-two-sides-of-girls':         '소울 아이들',
  'mir-2-new-kingdom':                    '미르2: 새왕국',
  'journey-of-monarch':                   '군주의 여정',
  'dark-angel-wings-of-the-abyss':        '다크엔젤: 심연의 날개',
  'a-thousand-years-again':               '천년 다시',
  'three-kingdoms-of-gale':               '질풍삼국',
  'bleach-brave-souls':                   '블리치: 브레이브 소울즈',
  'cloud-land-sword-and-magic':           '운검선경',
  'roem-fake-game':                       'ROEM',
  'madout2':                              'MadOut2',
  'fable-town-merging-games':             '페이블타운',
  'royal-kingdom':                        '로얄 킹덤',
  'unlimited-fighter':                    '무한 파이터',
  'abyss-destiny':                        '어비스 데스티니',
  'gangrim-2':                            '강림2',
  'devil-m':                              '데빌M',
  'girl-war':                             '소녀전쟁',
  'lord-of-nazarick':                     '나자릭의 군주',
  'lineage-ii-revolution':                '리니지2 레볼루션',
  'left-to-survive-zombie-games':         'Left to Survive',
  'mini-empires-heroes-never-cry':        '미니 엠파이어',
  'go-go-muffin-cbt':                     '고고머핀',
  'girls-frontline-2':                    '소녀전선2: 추방',
  'horizon-walker':                       '호라이즌 워커',
  'heroic-alliance':                      '영웅 얼라이언스',
  'starseed-asnia-trigger':               '스타시드: 아스니아 트리거',
  'king-arthur-legends-rise':             '킹 아서: 레전드 라이즈',
  'mad-metal-world':                      '매드 메탈 월드',
  'romantic-powerhouse':                  '로맨틱 파워하우스',
  'ssms':                                 'SSMS',
  'dragons-totem':                        '드래곤의 토템',
  'ace-defender-dragon-war':              '에이스 디펜더',
  'realm-of-mystery':                     '신비의 왕국',
  'raising-heroes-4000-draws-given-away': '영웅 키우기',
  'path-to-nowhere':                      '인외지道',
  'ancient-seal-the-exorcist':            '고인장: 강시도사',
  'the-ragnarok':                         '더 라그나로크',
  'zombie-io':                            '좀비.io',
  'bangbang-survivor':                    '뱅뱅 서바이버',
  'frost-and-fire-king-of-avalon':        '킹 오브 아발론',
  'monster-never-cry':                    '몬스터는 울지 않아',
  'epic-seven':                           '에픽세븐',
  'afk-journey':                          'AFK 저니',
  'blade-m':                              '블레이드M',
  'metin-overture-to-doom':               '메틴',
  'ace-division-mecha':                   '에이스 디비전',
  'zenless-zone-zero':                    '젠레스 존 제로',
  'combo-hero':                           '콤보 히어로',
  'honor-of-kings':                       '왕자영요',
  'genshin-impact':                       '원신',
  'summoners-war':                        '서머너즈 워',
  'tarisland':                            '타리스랜드',
  'seven-knights-idle-adventure':         '세븐나이츠 키우기',
  'arthdal-chronicles':                   '아스달 연대기',
  'soul-strike':                          '소울 스트라이크',
  'the-grand-mafia':                      '더 그랜드 마피아',
  'echocalypse':                          '에코칼립스',
  'watcher-of-realms':                    '왓처 오브 렐름스',
  'honkai-star-rail':                     '붕괴: 스타레일',
  'dragonheir-silent-gods':               '드래곤헤어: 사일런트 갓',
  'the-legend-of-heroes-gagharv':         '영웅전설: 가가르브 삼부작',
  'limbus-company':                       '림버스 컴퍼니',
  'reverse-1999':                         '리버스: 1999',
  'last-warsurvival-game':                '라스트 워: 서바이벌',
  'tales-and-dragons-newjourney':         '전설과 용: 새로운 여정',
  'the-seven-deadly-sins-idle':           '일곱 개의 대죄: 아이들',
  'delithe-last-memories':                '델리데: 라스트 메모리즈',
  'mini-heroes-reborn':                   '미니 히어로즈 리본',
  'kurokos-basketball-street-rivals':     '쿠로코의 농구',
};

/* ═══════════════════════════════════════════════════════
   게임 순위
═══════════════════════════════════════════════════════ */
const GAME_RANK = {
  '메이플스토리M': 1, '리니지M': 2, '리니지W': 3,
  '나 혼자만 레벨업: ARISE': 4, '붕괴: 스타레일': 5,
  '원신': 6, '젠레스 존 제로': 7, '명조: 워더링 웨이브': 8,
  '에픽세븐': 9, '아스달 연대기': 10,
  '라그나로크 오리진 클래식': 11, '라그나로크 오리진': 12,
  '쿠키런: 킹덤': 13, '쿠키런: 모험의 탑': 14,
  '쿠키런: 오븐스매시': 15, '쿠키런': 16,
  'AFK 저니': 17, '림버스 컴퍼니': 18,
  '서머너즈 워': 19, '왕자영요': 20,
  'WOS: 화이트아웃 서바이벌': 21,
  '레이드: 그림자의 전설': 22,
  '세븐 나이츠 리버스': 23, '세븐나이츠 키우기': 24,
  '운빨존많겜': 25, '좀비고등학교': 26,
  '뱀피르': 27, '스텔라 소라': 28,
};

/* ═══════════════════════════════════════════════════════
   유틸
═══════════════════════════════════════════════════════ */
function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('too many redirects'));
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml',
      }
    }, (res) => {
      if ([301,302,303,307].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location : BLUESTACKS_BASE + res.headers.location;
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
   Step 1: 게임 목록 수집
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
      const re = /href="(\/ko\/blog\/redeem-codes\/([^"]+)-redeem-codes-ko\.html)"/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        const path = m[1], slug = m[2];
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
   Step 2: 쿠폰 페이지 파싱
═══════════════════════════════════════════════════════ */
function parseCouponPage(html, slug) {
  // 한글 게임명 매핑 (슬러그 → 한글)
  let gameName = SLUG_TO_KO[slug];

  // 매핑 없으면 h1에서 파싱
  if (!gameName) {
    const h1 = (html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/) || [])[1] || slug;
    gameName = h1
      .replace(/공략\s*[-–]\s*최신.*/i, '')
      .replace(/사용 가능한 모든 쿠폰 코드.*/i, '')
      .replace(/\d{4}년.*/, '')
      .replace(/쿠폰 코드.*/i, '')
      .replace(/교환 코드.*/i, '')
      .trim();
  }

  // 앱 페이지 링크
  const appPageMatch = html.match(/href="(\/ko\/apps\/[^"]+on-pc\.html)"/);
  const appPageUrl = appPageMatch ? BLUESTACKS_BASE + appPageMatch[1] : null;

  // 쿠폰 파싱
  const coupons = [];
  const tableRe = /<tr[^>]*>[\s\S]*?<td[^>]*>\s*<strong>\s*([A-Z0-9가-힣_\-]{3,30})\s*<\/strong>\s*<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = tableRe.exec(html)) !== null) {
    const code = m[1].trim();
    const reward = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/^\d+$/.test(code)) coupons.push({ code, reward });
  }
  if (coupons.length === 0) {
    const boldRe = /<strong>\s*([A-Z0-9]{4,25})\s*<\/strong>/g;
    while ((m = boldRe.exec(html)) !== null) {
      const code = m[1].trim();
      if (!/^\d+$/.test(code)) coupons.push({ code, reward: '인게임 보상' });
    }
  }

  // 만료일
  const today = new Date();
  let expire = '무기한';
  const expMatch = html.match(/(\d{4})[년.\-](\d{1,2})[월.\-](\d{1,2})/);
  if (expMatch) {
    const d = new Date(expMatch[1], expMatch[2]-1, expMatch[3]);
    if (d > today) expire = `${expMatch[1]}.${String(expMatch[2]).padStart(2,'0')}.${String(expMatch[3]).padStart(2,'0')}`;
  }

  // 장르
  const genreMap = { '롤플레잉':'rpg','RPG':'rpg','MMORPG':'rpg','액션':'action','전략':'strategy','캐주얼':'casual','FPS':'fps' };
  let genre = 'rpg';
  for (const [k,v] of Object.entries(genreMap)) {
    if (html.includes(k)) { genre = v; break; }
  }

  return { gameName, appPageUrl, coupons, expire, genre };
}

/* ═══════════════════════════════════════════════════════
   Step 3: 앱 페이지에서 이미지 + 패키지명
═══════════════════════════════════════════════════════ */
async function fetchGameImage(appPageUrl) {
  if (!appPageUrl) return { imageUrl: null, packageName: null };
  try {
    const html = await fetchUrl(appPageUrl);
    const pkgMatch = html.match(/app_pkg=([a-z][a-z0-9._]+)/i);
    const packageName = pkgMatch ? pkgMatch[1] : null;
    const iconMatch = html.match(/src="(https:\/\/cdn-icon\.bluestacks\.com\/[^"]+)"/);
    const imageUrl = iconMatch ? iconMatch[1] : null;
    return { imageUrl, packageName };
  } catch (e) {
    return { imageUrl: null, packageName: null };
  }
}

/* ═══════════════════════════════════════════════════════
   Step 4: Firebase 저장
═══════════════════════════════════════════════════════ */
async function saveToDB(coupons) {
  if (!coupons.length) return;
  for (let i = 0; i < coupons.length; i += 400) {
    const batch = db.batch();
    for (const c of coupons.slice(i, i+400)) {
      const id = `${c.game}_${c.code}`.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
      batch.set(db.collection('coupons').doc(id), c, { merge: true });
    }
    await batch.commit();
  }
  console.log(`  💾 ${coupons.length}개 저장 완료`);
}

/* ═══════════════════════════════════════════════════════
   Step 5: 만료 쿠폰 정리
═══════════════════════════════════════════════════════ */
async function cleanCoupons() {
  console.log('🧹 만료 쿠폰 정리 중...');
  try {
    const snap = await db.collection('coupons').get();
    const today = new Date();
    const batch = db.batch();
    let expired = 0, old = 0;
    snap.forEach(doc => {
      const d = doc.data();
      if (d.expire && d.expire !== '무기한') {
        const parts = d.expire.split('.');
        if (parts.length === 3) {
          const exp = new Date(parts[0], parts[1]-1, parts[2]);
          if ((today - exp) / 86400000 > 1) { batch.delete(doc.ref); expired++; return; }
        }
      } else if (d.expire === '무기한' && d.createdAt) {
        if ((today - new Date(d.createdAt)) / 86400000 > 30) { batch.delete(doc.ref); old++; }
      }
    });
    if (expired + old > 0) { await batch.commit(); console.log(`  🗑️ 만료 ${expired}개 + 오래된 ${old}개 삭제\n`); }
    else console.log('  ✅ 삭제할 쿠폰 없음\n');
  } catch (e) { console.log('  ⚠️ 정리 실패:', e.message, '\n'); }
}

/* ═══════════════════════════════════════════════════════
   메인
═══════════════════════════════════════════════════════ */
async function main() {
  const startTime = Date.now();
  console.log('🚀 쿠폰던전 자동수집 시작!');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}`);
  console.log('💰 API 비용: 0원\n');

  await cleanCoupons();
  const gameList = await collectGameList();

  console.log(`🎮 게임별 쿠폰 + 이미지 수집 시작\n`);
  const allCoupons = [];
  let success = 0, empty = 0, fail = 0;

  for (const game of gameList) {
    try {
      const html = await fetchUrl(game.couponUrl);
      const { gameName, appPageUrl, coupons, expire, genre } = parseCouponPage(html, game.slug);

      if (coupons.length === 0) {
        process.stdout.write(`  ⬜ ${gameName}: 쿠폰 없음\n`);
        empty++; await delay(DELAY_MS); continue;
      }

      let imageUrl = null, packageName = null;
      if (appPageUrl) {
        const info = await fetchGameImage(appPageUrl);
        imageUrl = info.imageUrl; packageName = info.packageName;
        await delay(800);
      }

      const rank = GAME_RANK[gameName] || 500;
      const formatted = coupons
        .filter(c => c.code && c.code.length >= 3 && !/^\d+$/.test(c.code))
        .map(c => ({
          code: c.code.toUpperCase(), reward: c.reward || '인게임 보상',
          expire, source: '블루스택', game: gameName, genre,
          rank, imageUrl, packageName, status: 'new',
          views: Math.floor(Math.random() * 800) + 100,
          votes: { ok: 0, bad: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

      allCoupons.push(...formatted);
      console.log(`  ✅ ${gameName}: ${formatted.length}개 | 이미지: ${imageUrl ? '✓' : '✗'} | 순위: #${rank}`);
      success++;
    } catch (e) {
      console.log(`  ❌ ${game.slug}: ${e.message}`); fail++;
    }
    await delay(DELAY_MS);
  }

  console.log(`\n💾 Firebase 저장 중... (총 ${allCoupons.length}개)`);
  await saveToDB(allCoupons);

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('\n══════════════════════════════════════');
  console.log(`✅ 완료! ${Math.floor(elapsed/60)}분 ${elapsed%60}초`);
  console.log(`  성공: ${success}개 | 빈 페이지: ${empty}개 | 실패: ${fail}개`);
  console.log(`  저장된 쿠폰: ${allCoupons.length}개`);
  console.log(`  이미지 수집: ${allCoupons.filter(c=>c.imageUrl).length}개`);
  console.log('══════════════════════════════════════');
}

main().catch(console.error);
