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
  { name: '리니지W',           dev: 'NCSOFT',      genre: 'rpg', search: '리니지W 쿠폰 2025' },
  { name: '리니지M',           dev: 'NCSOFT',      genre: 'rpg', search: '리니지M 쿠폰 2025' },
  { name: '배틀그라운드 모바일',dev: 'Krafton',    genre: 'fps', search: 'PUBG Mobile 쿠폰 2025' },
  { name: '메이플스토리M',      dev: 'Nexon',      genre: 'rpg', search: '메이플스토리M 쿠폰 2025' },
  { name: '로스트아크',         dev: 'Smilegate',  genre: 'rpg', search: '로스트아크 쿠폰 2025' },
  { name: '원신',              dev: 'HoYoverse',   genre: 'rpg', search: '원신 쿠폰코드 2025' },
  { name: '붕괴: 스타레일',    dev: 'HoYoverse',   genre: 'rpg', search: '붕괴 스타레일 쿠폰 2025' },
  { name: '젠레스 존 제로',    dev: 'HoYoverse',   genre: 'rpg', search: '젠레스 존 제로 쿠폰 2025' },
  { name: '쿠키런: 킹덤',      dev: 'Devsisters',  genre: 'casual', search: '쿠키런 킹덤 쿠폰 2025' },
  { name: '던전앤파이터M',      dev: 'Nexon',      genre: 'rpg', search: '던전앤파이터M 쿠폰 2025' },
  { name: '블루 아카이브',      dev: 'Nexon',      genre: 'rpg', search: '블루아카이브 쿠폰 2025' },
  { name: '에픽세븐',           dev: 'Smilegate', genre: 'rpg', search: '에픽세븐 쿠폰 2025' },
  { name: '검은사막 모바일',    dev: 'Pearl Abyss', genre: 'rpg', search: '검은사막 모바일 쿠폰 2025' },
  { name: '나이트 크로우',      dev: 'MAG',        genre: 'rpg', search: '나이트크로우 쿠폰 2025' },
  { name: '라그나로크 오리진',  dev: 'Gravity',    genre: 'rpg', search: '라그나로크 오리진 쿠폰 2025' },
  { name: '브롤스타즈',         dev: 'Supercell',  genre: 'casual', search: '브롤스타즈 코드 2025' },
  { name: '클래시 오브 클랜',   dev: 'Supercell',  genre: 'strategy', search: '클래시오브클랜 코드 2025' },
  { name: '트릭컬 RE:VIVE',    dev: 'Broccoli',   genre: 'rpg', search: '트릭컬 쿠폰 2025' },
  { name: '아이온2',            dev: 'NCSOFT',     genre: 'rpg', search: '아이온2 쿠폰 2025' },
];

async function collectCoupons(game) {
  console.log(`\n🔍 ${game.name} 쿠폰 수집 중...`);
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `${game.search} 사이트를 검색해서 현재 유효한 쿠폰 코드를 찾아줘.
결과를 반드시 아래 JSON 형식으로만 답해줘. 다른 말은 하지 마:
[
  {
    "code": "쿠폰코드",
    "reward": "보상내용",
    "expire": "만료일(YYYY.MM.DD 또는 무기한)",
    "source": "출처(공식 트위터/카페 등)"
  }
]
쿠폰을 못 찾으면 빈 배열 [] 만 반환해.`
      }]
    });

    // 응답에서 텍스트 추출
    const textContent = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    if (!textContent || textContent.trim() === '[]') {
      console.log(`  ⚠️ ${game.name}: 쿠폰 없음`);
      return [];
    }

    // JSON 파싱
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const coupons = JSON.parse(jsonMatch[0]);
    console.log(`  ✅ ${game.name}: ${coupons.length}개 발견`);
    return coupons.map(c => ({
      ...c,
      game: game.name,
      dev: game.dev,
      genre: game.genre,
      status: 'new',
      views: Math.floor(Math.random() * 2000) + 500,
      votes: { ok: Math.floor(Math.random() * 100) + 10, bad: Math.floor(Math.random() * 10) },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.log(`  ❌ ${game.name} 오류:`, e.message);
    return [];
  }
}

async function saveToDB(coupons) {
  if (!coupons.length) return;
  const batch = db.batch();
  for (const coupon of coupons) {
    const id = `${coupon.game}_${coupon.code}`.replace(/[^a-zA-Z0-9가-힣_]/g, '_');
    const ref = db.collection('coupons').doc(id);
    // 기존에 있으면 업데이트, 없으면 새로 추가
    batch.set(ref, coupon, { merge: true });
  }
  await batch.commit();
  console.log(`💾 DB에 ${coupons.length}개 저장 완료`);
}

async function main() {
  console.log('🚀 쿠폰던전 자동수집 시작!');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}\n`);

  let total = 0;
  for (const game of GAMES) {
    const coupons = await collectCoupons(game);
    if (coupons.length > 0) {
      await saveToDB(coupons);
      total += coupons.length;
    }
    // API 과부하 방지 (2초 대기)
    await new Promise(r => setTimeout(r, 60000));
  }

  console.log(`\n✅ 완료! 총 ${total}개 쿠폰 수집/업데이트`);
}

main().catch(console.error);
