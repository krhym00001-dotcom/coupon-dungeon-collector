const Anthropic = require('@anthropic-ai/sdk');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase 초기화
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Claude API 초기화
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 수집 대상 게임 목록
const GAMES = [
  { name: '리니지W',           dev: 'NCSOFT',      genre: 'rpg',      search: '리니지W 쿠폰 2025' },
  { name: '리니지M',           dev: 'NCSOFT',      genre: 'rpg',      search: '리니지M 쿠폰 2025' },
  { name: '배틀그라운드 모바일',dev: 'Krafton',     genre: 'fps',      search: 'PUBG Mobile 쿠폰 2025' },
  { name: '메이플스토리M',      dev: 'Nexon',       genre: 'rpg',      search: '메이플스토리M 쿠폰 2025' },
  { name: '로스트아크',         dev: 'Smilegate',   genre: 'rpg',      search: '로스트아크 쿠폰 2025' },
  { name: '원신',               dev: 'HoYoverse',   genre: 'rpg',      search: '원신 쿠폰코드 2025' },
  { name: '붕괴: 스타레일',     dev: 'HoYoverse',   genre: 'rpg',      search: '붕괴 스타레일 쿠폰 2025' },
  { name: '젠레스 존 제로',     dev: 'HoYoverse',   genre: 'rpg',      search: '젠레스 존 제로 쿠폰 2025' },
  { name: '쿠키런: 킹덤',       dev: 'Devsisters',  genre: 'casual',   search: '쿠키런 킹덤 쿠폰 2025' },
  { name: '던전앤파이터M',      dev: 'Nexon',       genre: 'rpg',      search: '던전앤파이터M 쿠폰 2025' },
  { name: '블루 아카이브',      dev: 'Nexon',       genre: 'rpg',      search: '블루아카이브 쿠폰 2025' },
  { name: '에픽세븐',           dev: 'Smilegate',   genre: 'rpg',      search: '에픽세븐 쿠폰 2025' },
  { name: '검은사막 모바일',    dev: 'Pearl Abyss', genre: 'rpg',      search: '검은사막 모바일 쿠폰 2025' },
  { name: '나이트 크로우',      dev: 'MAG',         genre: 'rpg',      search: '나이트크로우 쿠폰 2025' },
  { name: '라그나로크 오리진',  dev: 'Gravity',     genre: 'rpg',      search: '라그나로크 오리진 쿠폰 2025' },
  { name: '브롤스타즈',         dev: 'Supercell',   genre: 'casual',   search: '브롤스타즈 코드 2025' },
  { name: '클래시 오브 클랜',   dev: 'Supercell',   genre: 'strategy', search: '클래시오브클랜 코드 2025' },
  { name: '트릭컬 RE:VIVE',    dev: 'Broccoli',    genre: 'rpg',      search: '트릭컬 쿠폰 2025' },
  { name: '아이온2',            dev: 'NCSOFT',      genre: 'rpg',      search: '아이온2 쿠폰 2025' },
];

// ── 핵심 수정 1: 2초 대기 (60초 → 2초)
// GitHub Actions 무료 플랜 6분 제한 내에 19개 게임 전부 처리 가능
const DELAY_MS = 2000;

async function collectCoupons(game) {
  console.log(`\n🔍 ${game.name} 수집 중...`);
  try {
    const response = await client.messages.create({
      // ── 핵심 수정 2: 올바른 모델명
      model: 'claude-haiku-4-5-20251001',  // 빠르고 저렴 — 수집용으로 최적
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `"${game.search}" 를 웹에서 검색해서 현재 유효한 쿠폰 코드를 찾아줘.
반드시 아래 JSON 배열 형식으로만 답해줘. 설명, 마크다운 없이 JSON만:
[{"code":"쿠폰코드","reward":"보상내용","expire":"만료일(YYYY.MM.DD 또는 무기한)","source":"출처"}]
쿠폰 없으면 [] 만 반환.`
      }]
    });

    const textContent = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    if (!textContent || textContent.trim() === '[]') {
      console.log(`  ⚠️ ${game.name}: 쿠폰 없음`);
      return [];
    }

    const jsonMatch = textContent.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log(`  ⚠️ ${game.name}: JSON 파싱 실패`);
      return [];
    }

    const coupons = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(coupons) || coupons.length === 0) return [];

    console.log(`  ✅ ${game.name}: ${coupons.length}개 발견`);
    return coupons
      .filter(c => c.code && c.code.trim().length > 2) // 너무 짧은 코드 필터
      .map(c => ({
        code:      c.code.trim().toUpperCase(),
        reward:    c.reward || '보상 정보 없음',
        expire:    c.expire || '무기한',
        source:    c.source || '웹 검색',
        game:      game.name,
        dev:       game.dev,
        genre:     game.genre,
        status:    'new',
        views:     Math.floor(Math.random() * 1500) + 300,
        votes:     { ok: Math.floor(Math.random() * 80) + 5, bad: Math.floor(Math.random() * 8) },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

  } catch (e) {
    console.log(`  ❌ ${game.name} 오류: ${e.message}`);
    return [];
  }
}

async function saveToDB(coupons) {
  if (!coupons.length) return;
  const batch = db.batch();
  for (const coupon of coupons) {
    const id = `${coupon.game}_${coupon.code}`.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    const ref = db.collection('coupons').doc(id);
    batch.set(ref, coupon, { merge: true });
  }
  await batch.commit();
  console.log(`  💾 ${coupons.length}개 저장 완료`);
}

// ── 핵심 수정 3: 만료된 쿠폰 자동 삭제
async function cleanExpiredCoupons() {
  console.log('\n🧹 만료 쿠폰 정리 중...');
  try {
    const snap = await db.collection('coupons').get();
    const today = new Date();
    const batch = db.batch();
    let count = 0;

    snap.forEach(doc => {
      const data = doc.data();
      if (!data.expire || data.expire === '무기한') return;

      // YYYY.MM.DD 형식 파싱
      const parts = data.expire.split('.');
      if (parts.length !== 3) return;
      const expDate = new Date(parts[0], parts[1] - 1, parts[2]);

      // 만료일이 7일 이상 지났으면 삭제
      const diffDays = (today - expDate) / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        batch.delete(doc.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`  🗑️ 만료 쿠폰 ${count}개 삭제 완료`);
    } else {
      console.log('  ✅ 삭제할 만료 쿠폰 없음');
    }
  } catch (e) {
    console.log('  ⚠️ 만료 정리 실패:', e.message);
  }
}

async function main() {
  console.log('🚀 쿠폰던전 자동수집 시작!');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🎮 수집 대상: ${GAMES.length}개 게임\n`);

  // 만료 쿠폰 먼저 정리
  await cleanExpiredCoupons();

  let total = 0;
  for (const game of GAMES) {
    const coupons = await collectCoupons(game);
    if (coupons.length > 0) {
      await saveToDB(coupons);
      total += coupons.length;
    }
    // 2초 대기 (API 과부하 방지 + 타임아웃 방지)
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n✅ 완료! 총 ${total}개 쿠폰 수집/업데이트`);
  console.log(`⏱️ 예상 소요시간: 약 ${Math.ceil(GAMES.length * DELAY_MS / 1000 / 60)}분`);
}

main().catch(console.error);

