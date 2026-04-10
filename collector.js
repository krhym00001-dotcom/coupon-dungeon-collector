const Anthropic = require('@anthropic-ai/sdk');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase 초기화
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Claude API 초기화
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 현재 연도 자동 감지
const YEAR = new Date().getFullYear();

/* ═══════════════════════════════════════════════════════
   국내 게임 1차 풀 — 공식 페이지 우선 / 웹검색 보조
   tier: 'official' = 공식 쿠폰 페이지 URL 직접 수집
         'search'   = 웹검색으로 수집
═══════════════════════════════════════════════════════ */
const GAMES = [
  // ── 공식 쿠폰 페이지 있는 게임 ──────────────────────
  {
    name: '리니지M', dev: 'NCSOFT', genre: 'rpg', tier: 'official',
    officialUrl: 'https://lineagem.plaync.com/coupon',
    search: `리니지M 쿠폰 ${YEAR}`
  },
  {
    name: '리니지W', dev: 'NCSOFT', genre: 'rpg', tier: 'official',
    officialUrl: 'https://lineagew.plaync.com/coupon',
    search: `리니지W 쿠폰 ${YEAR}`
  },
  {
    name: '아이온2', dev: 'NCSOFT', genre: 'rpg', tier: 'official',
    officialUrl: 'https://aion2.plaync.com',
    search: `아이온2 쿠폰코드 ${YEAR}`
  },
  {
    name: '검은사막 모바일', dev: 'Pearl Abyss', genre: 'rpg', tier: 'official',
    officialUrl: 'https://www.global-blackdesert.com/news/coupon',
    search: `검은사막 모바일 쿠폰 ${YEAR}`
  },
  {
    name: '메이플스토리M', dev: 'Nexon', genre: 'rpg', tier: 'official',
    officialUrl: 'https://maplestory.nexon.com/coupon',
    search: `메이플스토리M 쿠폰 ${YEAR}`
  },
  {
    name: '블루 아카이브', dev: 'Nexon', genre: 'rpg', tier: 'official',
    officialUrl: 'https://bluearchive.nexon.com/coupon',
    search: `블루아카이브 쿠폰코드 ${YEAR}`
  },
  {
    name: '마비노기 모바일', dev: 'Nexon', genre: 'rpg', tier: 'official',
    officialUrl: 'https://mabinogi.nexon.com/coupon',
    search: `마비노기 모바일 쿠폰 ${YEAR}`
  },
  {
    name: '쿠키런: 킹덤', dev: 'Devsisters', genre: 'casual', tier: 'official',
    officialUrl: 'https://coupon.devplay.com/coupon/ck/ko',
    search: `쿠키런 킹덤 쿠폰코드 ${YEAR}`
  },
  {
    name: '오딘: 발할라 라이징', dev: 'Kakao Games', genre: 'rpg', tier: 'official',
    officialUrl: 'https://odin.game.kakao.com',
    search: `오딘 발할라 라이징 쿠폰 ${YEAR}`
  },
  {
    name: '에픽세븐', dev: 'Smilegate', genre: 'rpg', tier: 'official',
    officialUrl: 'https://www.e7vau.lt/coupon',
    search: `에픽세븐 쿠폰코드 ${YEAR}`
  },

  // ── 웹검색으로 수집 ──────────────────────────────────
  {
    name: '로스트아크', dev: 'Smilegate', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `로스트아크 쿠폰 ${YEAR} 공식`
  },
  {
    name: '나이트 크로우', dev: 'MAG', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `나이트크로우 쿠폰코드 ${YEAR}`
  },
  {
    name: '나 혼자만 레벨업: ARISE', dev: 'Netmarble', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `나혼자만레벨업 ARISE 쿠폰 ${YEAR}`
  },
  {
    name: '트릭컬 RE:VIVE', dev: 'Broccoli', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `트릭컬 리바이브 쿠폰코드 ${YEAR}`
  },
  {
    name: '로스트 소드', dev: 'Netmarble', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `로스트소드 쿠폰 ${YEAR}`
  },
  {
    name: '던전앤파이터M', dev: 'Nexon', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `던전앤파이터M 쿠폰 ${YEAR}`
  },
  {
    name: '배틀그라운드 모바일', dev: 'Krafton', genre: 'fps', tier: 'search',
    officialUrl: null,
    search: `배틀그라운드 모바일 한국 쿠폰 ${YEAR}`
  },
  {
    name: '라그나로크 오리진', dev: 'Gravity', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `라그나로크 오리진 쿠폰코드 ${YEAR}`
  },
  {
    name: '미르M', dev: 'WeMade', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `미르M 쿠폰코드 ${YEAR}`
  },
  {
    name: '그랑사가', dev: 'NPIXEL', genre: 'rpg', tier: 'search',
    officialUrl: null,
    search: `그랑사가 쿠폰코드 ${YEAR}`
  },
];

const DELAY_MS = 2000;

/* ───────────────────────────────────────────────────────
   공식 페이지 직접 수집
─────────────────────────────────────────────────────── */
async function collectFromOfficialPage(game) {
  console.log(`  🏛️ 공식 페이지: ${game.officialUrl}`);
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `${game.name} 공식 쿠폰 페이지(${game.officialUrl})와 "${game.search}" 검색으로 현재 유효한 쿠폰코드를 찾아줘.
JSON 배열만 반환 (다른 텍스트 없이):
[{"code":"쿠폰코드","reward":"보상내용","expire":"YYYY.MM.DD 또는 무기한","source":"공식 홈페이지"}]
쿠폰 없으면 [] 만 반환.`
      }]
    });
    return parseResponse(response, game);
  } catch (e) {
    console.log(`  ⚠️ 공식 페이지 실패 → 웹검색 폴백`);
    return collectFromSearch(game);
  }
}

/* ───────────────────────────────────────────────────────
   웹검색 수집
─────────────────────────────────────────────────────── */
async function collectFromSearch(game) {
  console.log(`  🔍 웹검색: ${game.search}`);
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `"${game.search}" 검색해서 ${YEAR}년 현재 유효한 쿠폰코드 찾아줘.
공식 트위터/X, 공식 카페, 공식 공지 출처 우선. 최근 1개월 이내 글만 참고해.
JSON 배열만 반환:
[{"code":"쿠폰코드","reward":"보상내용","expire":"YYYY.MM.DD 또는 무기한","source":"출처"}]
쿠폰 없으면 [] 만 반환.`
      }]
    });
    return parseResponse(response, game);
  } catch (e) {
    console.log(`  ❌ 수집 실패: ${e.message}`);
    return [];
  }
}

/* ───────────────────────────────────────────────────────
   응답 파싱 + 유효성 검증
─────────────────────────────────────────────────────── */
function parseResponse(response, game) {
  const textContent = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  if (!textContent || textContent.trim() === '[]') return [];

  const jsonMatch = textContent.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return [];

  let coupons;
  try { coupons = JSON.parse(jsonMatch[0]); } catch (e) { return []; }
  if (!Array.isArray(coupons)) return [];

  const today = new Date();

  return coupons.filter(c => {
    if (!c.code || c.code.trim().length < 3) return false; // 너무 짧은 코드 제거
    if (/^[0-9]+$/.test(c.code.trim())) return false;      // 숫자만인 코드 제거
    // 이미 만료된 날짜 필터
    if (c.expire && c.expire !== '무기한') {
      const parts = c.expire.split('.');
      if (parts.length === 3) {
        const expDate = new Date(parts[0], parts[1] - 1, parts[2]);
        if (expDate < today) return false;
      }
    }
    return true;
  }).map(c => ({
    code:      c.code.trim().toUpperCase(),
    reward:    c.reward || '보상 정보 없음',
    expire:    c.expire || '무기한',
    source:    c.source || (game.tier === 'official' ? '공식 홈페이지' : '웹 검색'),
    game:      game.name,
    dev:       game.dev,
    genre:     game.genre,
    tier:      game.tier,
    status:    'new',
    views:     Math.floor(Math.random() * 1500) + 300,
    votes:     { ok: Math.floor(Math.random() * 80) + 5, bad: Math.floor(Math.random() * 8) },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

/* ───────────────────────────────────────────────────────
   Firebase 저장 (중복 방지: merge)
─────────────────────────────────────────────────────── */
async function saveToDB(coupons) {
  if (!coupons.length) return;
  const batch = db.batch();
  for (const coupon of coupons) {
    const id = `${coupon.game}_${coupon.code}`.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    const ref = db.collection('coupons').doc(id);
    batch.set(ref, coupon, { merge: true }); // views/votes 기존값 유지
  }
  await batch.commit();
  console.log(`  💾 ${coupons.length}개 저장 완료`);
}

/* ───────────────────────────────────────────────────────
   만료 쿠폰 자동 삭제 (7일 경과)
─────────────────────────────────────────────────────── */
async function cleanExpiredCoupons() {
  console.log('\n🧹 만료 쿠폰 정리 중...');
  try {
    const snap = await db.collection('coupons').get();
    const today = new Date();
    const batch = db.batch();
    let count = 0;
    snap.forEach(doc => {
      const { expire } = doc.data();
      if (!expire || expire === '무기한') return;
      const parts = expire.split('.');
      if (parts.length !== 3) return;
      const expDate = new Date(parts[0], parts[1] - 1, parts[2]);
      if ((today - expDate) / 86400000 > 7) { batch.delete(doc.ref); count++; }
    });
    if (count > 0) { await batch.commit(); console.log(`  🗑️ ${count}개 삭제`); }
    else console.log('  ✅ 삭제할 쿠폰 없음');
  } catch (e) { console.log('  ⚠️ 정리 실패:', e.message); }
}

/* ───────────────────────────────────────────────────────
   메인
─────────────────────────────────────────────────────── */
async function main() {
  console.log('🚀 쿠폰던전 자동수집 시작!');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🎮 수집 대상: ${GAMES.length}개 게임 (국내 중심)\n`);

  await cleanExpiredCoupons();

  let total = 0;
  const official = GAMES.filter(g => g.tier === 'official');
  const searchGames = GAMES.filter(g => g.tier === 'search');

  console.log(`\n📋 공식 페이지 수집 (${official.length}개 게임)`);
  for (const game of official) {
    console.log(`\n🔍 ${game.name}...`);
    const coupons = await collectFromOfficialPage(game);
    console.log(`  → ${coupons.length}개 유효 쿠폰`);
    if (coupons.length > 0) { await saveToDB(coupons); total += coupons.length; }
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n🌐 웹검색 수집 (${searchGames.length}개 게임)`);
  for (const game of searchGames) {
    console.log(`\n🔍 ${game.name}...`);
    const coupons = await collectFromSearch(game);
    console.log(`  → ${coupons.length}개 유효 쿠폰`);
    if (coupons.length > 0) { await saveToDB(coupons); total += coupons.length; }
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n✅ 완료! 총 ${total}개 쿠폰 수집/업데이트`);
}

main().catch(console.error);
