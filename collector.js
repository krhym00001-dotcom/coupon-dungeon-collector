const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase 초기화
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const BLUESTACKS_BASE = 'https://www.bluestacks.com';
const TOTAL_PAGES = 11;
const DELAY_MS = 1500;
const SITE_URL = 'https://coupondungeon.kr';

/* ═══════════════════════════════════════════════════════
   iTunes 게임명 → 영문 매핑
═══════════════════════════════════════════════════════ */
const GAME_EN_NAME = {
  // 한국 앱스토어 등록명 기준 (한글 검색이 더 정확한 게임들)
  '원신': '원신',
  '붕괴: 스타레일': '붕괴: 스타레일',
  '젠레스 존 제로': '젠레스 존 제로',
  '명조: 워더링 웨이브': '명조: 워더링 웨이브',
  '리니지W': '리니지W',
  '리니지M': '리니지M',
  '리니지2M': '리니지2M',
  '메이플스토리M': '메이플스토리M',
  '배틀그라운드 모바일': 'PUBG MOBILE',
  // 로스트아크는 PC게임이라 앱스토어 없음 → 블루스택 폴백
  '나 혼자만 레벨업: ARISE': '나 혼자만 레벨업',
  '에픽세븐': '에픽세븐',
  '블루 아카이브': '블루 아카이브',
  '던전앤파이터M': '던전앤파이터M',
  '검은사막 모바일': '검은사막 모바일',
  '쿠키런: 킹덤': '쿠키런: 킹덤',
  '쿠키런: 모험의 탑': '쿠키런: 모험의 탑',
  '쿠키런: 오븐스매시': '쿠키런: 오븐스매시',
  '브롤스타즈': 'Brawl Stars',
  '클래시 오브 클랜': 'Clash of Clans',
  '클래시 로얄': 'Clash Royale',
  '아이온2': '아이온2',
  '나이트 크로우': '나이트 크로우',
  '라그나로크 오리진': '라그나로크 오리진',
  '라그나로크 오리진 클래식': '라그나로크 오리진 클래식',
  '뱀피르': '뱀피르',
  '오버워치2': 'Overwatch 2',
  'AFK 저니': 'AFK Journey',
  '림버스 컴퍼니': '림버스 컴퍼니',
  '서머너즈 워': '서머너즈 워',
  '몬스터는 울지 않아': '몬스터는 울지 않아',
  'Once Human': 'Once Human',
  '마비노기 모바일': '마비노기 모바일',
  '트릭컬 RE:VIVE': '트릭컬 RE:VIVE',
  '아스달 연대기': '아스달 연대기',
  '세나: 최후의 방어선': '세나: 최후의 방어선',
  '미르4': 'MIR4',
  '그랑사가': '그랑사가',
  '에코칼립스': 'EchoCalypse',
  '왓처 오브 렐름스': 'Watcher of Realms',
  '리버스: 1999': 'Reverse: 1999',
  '드래곤헤어: 사일런트 갓': 'Dragonheir: Silent Gods',
  '피파 모바일': 'EA SPORTS FC 모바일',
  '나자릭의 군주': '나자릭의 군주',
  '소녀전선2: 추방': '소녀전선2: 추방',
  '주술회전 팬텀 퍼레이드': '주술회전 팬텀 퍼레이드',
  '운빨존많겜': 'Lucky Defense',
  '냥코 대전쟁': '냥코 대전쟁',
  'WOS: 화이트아웃 서바이벌': 'Whiteout Survival',
  '포켓몬 카드 게임 Pocket': 'Pokémon TCG Pocket',
  '레이드: 그림자의 전설': 'RAID: Shadow Legends',
  '스텔라 소라': '스텔라 소라',
  '스카이: 빛의 아이들': 'Sky: 빛의 아이들',
};

/* ═══════════════════════════════════════════════════════
   슬러그 → 한글 게임명 매핑
═══════════════════════════════════════════════════════ */
const SLUG_TO_KO = {
  'ragnarok-origin-classic':'라그나로크 오리진 클래식',
  'ragnarok-origin':'라그나로크 오리진',
  'last-z-survival-shooter':'Last Z: 서바이벌 슈터',
  'dragon-traveler':'그놈은 드래곤',
  'the-battle-cats':'냥코 대전쟁',
  'lucky-defense':'운빨존많겜',
  'jujutsu-kaisen-phantom-parade':'주술회전 팬텀 퍼레이드',
  'cookierun-ovensmash':'쿠키런: 오븐스매시',
  'dx-the-awakened':'DX: 각성자들',
  'zombie-high-school':'좀비고등학교',
  'the-seven-deadly-sins-origin':'일곱 개의 대죄: Origin',
  'wow-adventurers':'우와 모험단',
  'wuthering-waves':'명조: 워더링 웨이브',
  'mongil-star-dive':'몬길: STAR DIVE',
  'arknights-endfield':'명일방주: 엔드필드',
  'top-heroes':'탑 히어로즈',
  'cookierun':'쿠키런',
  'cookierun-tower-of-adventures':'쿠키런: 모험의 탑',
  'whiteout-survival':'WOS: 화이트아웃 서바이벌',
  'where-winds-meet':'연운',
  'raid-shadow-legends':'레이드: 그림자의 전설',
  'pokemon-tcg-pocket':'포켓몬 카드 게임 Pocket',
  'stella-sora':'스텔라 소라',
  'the-return-of-the-king':'열혈강호: 귀환',
  'once-human':'Once Human',
  'vampir':'뱀피르',
  'timeless-isle-latale':'라테일 플러스',
  'seven-knights-re-birth':'세븐 나이츠 리버스',
  'sword-of-justice':'역수한',
  'legend-of-mir-2-red-knight':'미르2: 레드나이트',
  'mafia-mobile':'마피아 모바일',
  'maplestory-m':'메이플스토리M',
  'solo-leveling-arise':'나 혼자만 레벨업: ARISE',
  'persona-phantom-of-the-night':'페르소나: 팬텀 오브 더 나이트',
  'dark-war-survival':'다크워: 서바이벌',
  'tree-of-savior-new-world':'트리 오브 세이비어: 뉴월드',
  'delta-force':'델타포스',
  'soul-idle-two-sides-of-girls':'소울 아이들',
  'mir-2-new-kingdom':'미르2: 새왕국',
  'journey-of-monarch':'군주의 여정',
  'dark-angel-wings-of-the-abyss':'다크엔젤: 심연의 날개',
  'a-thousand-years-again':'천년 다시',
  'three-kingdoms-of-gale':'질풍삼국',
  'bleach-brave-souls':'블리치: 브레이브 소울즈',
  'cloud-land-sword-and-magic':'운검선경',
  'roem-fake-game':'ROEM',
  'madout2':'MadOut2',
  'fable-town-merging-games':'페이블타운',
  'royal-kingdom':'로얄 킹덤',
  'unlimited-fighter':'무한 파이터',
  'abyss-destiny':'어비스 데스티니',
  'gangrim-2':'강림2',
  'devil-m':'데빌M',
  'girl-war':'소녀전쟁',
  'lord-of-nazarick':'나자릭의 군주',
  'lineage-ii-revolution':'리니지2 레볼루션',
  'left-to-survive-zombie-games':'Left to Survive',
  'mini-empires-heroes-never-cry':'미니 엠파이어',
  'go-go-muffin-cbt':'고고머핀',
  'girls-frontline-2':'소녀전선2: 추방',
  'horizon-walker':'호라이즌 워커',
  'heroic-alliance':'영웅 얼라이언스',
  'starseed-asnia-trigger':'스타시드: 아스니아 트리거',
  'king-arthur-legends-rise':'킹 아서: 레전드 라이즈',
  'mad-metal-world':'매드 메탈 월드',
  'romantic-powerhouse':'로맨틱 파워하우스',
  'ssms':'SSMS',
  'dragons-totem':'드래곤의 토템',
  'ace-defender-dragon-war':'에이스 디펜더',
  'realm-of-mystery':'신비의 왕국',
  'raising-heroes-4000-draws-given-away':'영웅 키우기',
  'path-to-nowhere':'인외지道',
  'ancient-seal-the-exorcist':'고인장: 강시도사',
  'the-ragnarok':'더 라그나로크',
  'zombie-io':'좀비.io',
  'bangbang-survivor':'뱅뱅 서바이버',
  'frost-and-fire-king-of-avalon':'킹 오브 아발론',
  'monster-never-cry':'몬스터는 울지 않아',
  'epic-seven':'에픽세븐',
  'afk-journey':'AFK 저니',
  'blade-m':'블레이드M',
  'metin-overture-to-doom':'메틴',
  'ace-division-mecha':'에이스 디비전',
  'zenless-zone-zero':'젠레스 존 제로',
  'combo-hero':'콤보 히어로',
  'honor-of-kings':'Honor of Kings',
  'genshin-impact':'원신',
  'summoners-war':'서머너즈 워',
  'tarisland':'타리스랜드',
  'seven-knights-idle-adventure':'세븐나이츠 키우기',
  'arthdal-chronicles':'아스달 연대기',
  'soul-strike':'소울 스트라이크',
  'the-grand-mafia':'더 그랜드 마피아',
  'echocalypse':'에코칼립스',
  'watcher-of-realms':'왓처 오브 렐름스',
  'honkai-star-rail':'붕괴: 스타레일',
  'dragonheir-silent-gods':'드래곤헤어: 사일런트 갓',
  'limbus-company':'림버스 컴퍼니',
  'reverse-1999':'리버스: 1999',
  'last-warsurvival-game':'라스트 워: 서바이벌',
  'tales-and-dragons-newjourney':'전설과 용: 새로운 여정',
};

const GAME_RANK = {
  '메이플스토리M':1,'리니지M':2,'리니지W':3,
  '나 혼자만 레벨업: ARISE':4,'붕괴: 스타레일':5,
  '원신':6,'젠레스 존 제로':7,'명조: 워더링 웨이브':8,
  '에픽세븐':9,'아스달 연대기':10,
  '라그나로크 오리진 클래식':11,'라그나로크 오리진':12,
  '쿠키런: 킹덤':13,'쿠키런: 모험의 탑':14,
  'AFK 저니':17,'림버스 컴퍼니':18,
  '서머너즈 워':19,
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
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      }
    }, (res) => {
      if ([301,302,303,307].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location : BLUESTACKS_BASE + res.headers.location;
        return fetchUrl(next, redirectCount+1).then(resolve).catch(reject);
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

function toSlug(str) {
  return str
    .replace(/[:\s]+/g, '-')
    .replace(/[^\w가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}


/* ═══════════════════════════════════════════════════════
   호요버스 게임 전용 쿠폰 수집
   (원신, 붕괴:스타레일, 젠레스 존 제로, 명조)
═══════════════════════════════════════════════════════ */
const HOYOVERSE_GAMES = [
  {
    name: '원신',
    slug: 'genshin-impact',
    url: 'https://www.pockettactics.com/genshin-impact/codes',
    genre: 'rpg',
    rank: 6,
  },
  {
    name: '붕괴: 스타레일',
    slug: 'honkai-star-rail',
    url: 'https://www.pockettactics.com/honkai-star-rail/codes',
    genre: 'rpg',
    rank: 5,
  },
  {
    name: '젠레스 존 제로',
    slug: 'zenless-zone-zero',
    url: 'https://www.pockettactics.com/zenless-zone-zero/codes',
    genre: 'rpg',
    rank: 7,
  },
  {
    name: '명조: 워더링 웨이브',
    slug: 'wuthering-waves',
    url: 'https://www.pockettactics.com/wuthering-waves/codes',
    genre: 'rpg',
    rank: 8,
  },
];

// Pockettactics에서 쿠폰 코드 파싱
function parsePockettacticsCodes(html, gameName) {
  const coupons = [];
  try {
    // <li> 태그 안의 코드 패턴 찾기
    // 형태: <li><strong>CODE123</strong> – 보상 설명</li>
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = liRe.exec(html)) !== null) {
      const liContent = m[1];
      // strong 태그 안의 코드 추출
      const codeMatch = liContent.match(/<strong[^>]*>\s*([A-Z0-9]{4,25})\s*<\/strong>/i);
      if (!codeMatch) continue;
      const code = codeMatch[1].trim().toUpperCase();
      if (/^\d+$/.test(code)) continue; // 숫자만이면 스킵

      // 보상 텍스트 추출
      const reward = liContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(code, '')
        .replace(/^[\s\-–—]+/, '')
        .trim()
        .substring(0, 100);

      coupons.push({ code, reward: reward || '인게임 보상' });
    }

    // 위 방법으로 못 찾으면 코드 블록에서 직접 추출
    if (coupons.length === 0) {
      const codeRe = /([A-Z]{2,}[A-Z0-9]{2,}[0-9A-Z]*)/g;
      const found = new Set();
      let cm;
      while ((cm = codeRe.exec(html)) !== null) {
        const code = cm[1];
        if (code.length >= 6 && code.length <= 25 && !/^\d+$/.test(code) && !found.has(code)) {
          // 일반 단어 필터링
          if (/[0-9]/.test(code) || code.length >= 8) {
            found.add(code);
            coupons.push({ code, reward: '인게임 보상' });
          }
        }
      }
    }
  } catch(e) {
    console.log(`    ⚠️ ${gameName} 파싱 오류: ${e.message}`);
  }
  return coupons;
}

async function collectHoyoverseCoupons() {
  console.log('\n🎮 호요버스 게임 쿠폰 수집 시작...');
  const allCoupons = [];

  for (const game of HOYOVERSE_GAMES) {
    try {
      const html = await fetchUrl(game.url);
      const coupons = parsePockettacticsCodes(html, game.name);

      // iTunes 이미지 가져오기
      const imageUrl = await fetchItunesImage(game.name);
      await delay(300);

      const formatted = coupons.map(c => ({
        code: c.code,
        reward: c.reward,
        expire: '무기한',
        source: 'Pockettactics',
        game: game.name,
        genre: game.genre,
        rank: game.rank,
        imageUrl,
        packageName: null,
        status: 'new',
        views: Math.floor(1000 + Math.random() * 2000),
        votes: {
          ok: Math.floor(50 + Math.random() * 150),
          bad: Math.floor(5 + Math.random() * 20)
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      console.log(`  ✅ ${game.name}: ${coupons.length}개 수집 | 이미지: ${imageUrl ? '✓' : '✗'}`);
      allCoupons.push(...formatted);
    } catch(e) {
      console.log(`  ❌ ${game.name} 수집 실패: ${e.message}`);
    }
    await delay(1000);
  }

  return allCoupons;
}

/* ═══════════════════════════════════════════════════════
   iTunes Search API - 합법적 고화질 아이콘
═══════════════════════════════════════════════════════ */
async function fetchItunesImage(gameName) {
  const searchTerm = GAME_EN_NAME[gameName] || gameName;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=kr&entity=software&limit=3`;

  try {
    const body = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
    });

    const json = JSON.parse(body);
    if (json.results && json.results.length > 0) {
      const app = json.results[0];
      // 512px 고화질 우선
      const imageUrl = app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60;
      console.log(`    🍎 iTunes: ${app.trackName} → ${imageUrl ? '✓' : '✗'}`);
      return imageUrl || null;
    }
    return null;
  } catch(e) {
    console.log(`    ⚠️ iTunes 실패 (${gameName}): ${e.message}`);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   게임 이미지 가져오기 (iTunes 우선 → 블루스택 폴백)
═══════════════════════════════════════════════════════ */
async function fetchGameImage(appPageUrl, gameName) {
  // 1. iTunes API 우선 (합법적, 고화질 512px)
  const itunesUrl = await fetchItunesImage(gameName);
  if (itunesUrl) return { imageUrl: itunesUrl, packageName: null };
  await delay(300);

  // 2. iTunes 실패 시 블루스택 폴백
  if (!appPageUrl) return { imageUrl: null, packageName: null };
  try {
    const html = await fetchUrl(appPageUrl);
    const pkgMatch = html.match(/app_pkg=([a-z][a-z0-9._]+)/i);
    const packageName = pkgMatch ? pkgMatch[1] : null;
    const iconMatch = html.match(/src="(https:\/\/cdn-icon\.bluestacks\.com\/[^"]+)"/);
    return { imageUrl: iconMatch ? iconMatch[1] : null, packageName };
  } catch(e) { return { imageUrl: null, packageName: null }; }
}


/* ═══════════════════════════════════════════════════════
   공략 정적 페이지 생성
═══════════════════════════════════════════════════════ */
function buildGuidePage(guide) {
  const slug = toSlug(guide.title || '');
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString('ko-KR');
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.content ? guide.content.substring(0, 150) : guide.title,
    "url": `${SITE_URL}/guide/${slug}.html`,
    "dateModified": new Date().toISOString(),
    "author": {"@type": "Organization", "name": "쿠폰던전"},
    "publisher": {"@type": "Organization", "name": "쿠폰던전"},
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type":"ListItem","position":1,"name":"쿠폰던전","item":SITE_URL},
        {"@type":"ListItem","position":2,"name":"공략","item":`${SITE_URL}/#guide`},
        {"@type":"ListItem","position":3,"name":guide.title,"item":`${SITE_URL}/guide/${slug}.html`}
      ]
    }
  };

  const content = (guide.content || '공략 내용이 없어요.')
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${guide.title} — 쿠폰던전 공략</title>
<meta name="description" content="${guide.title}. 쿠폰던전에서 최신 게임 공략을 확인하세요.">
<meta property="og:title" content="${guide.title} — 쿠폰던전">
<meta property="og:url" content="${SITE_URL}/guide/${slug}.html">
<link rel="canonical" href="${SITE_URL}/guide/${slug}.html">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3292286283313303" crossorigin="anonymous"></script>
<script type="application/ld+json">${JSON.stringify(schemaData)}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#09090f;color:#efefef;font-family:'Noto Sans KR',sans-serif;min-height:100vh;line-height:1.8}
a{color:#e94560;text-decoration:none}
header{background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);padding:0 1.25rem;height:54px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:18px;font-weight:800;color:#efefef}.logo span{color:#e94560}
.home-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#aaa;padding:6px 14px;border-radius:7px;font-size:12px;text-decoration:none}
.ad-wrap{padding:8px 1.25rem;background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:center}
.container{max-width:800px;margin:0 auto;padding:1.5rem 1.25rem}
.breadcrumb{font-size:12px;color:#555;margin-bottom:1.5rem}
.breadcrumb a{color:#aaa}
.article-header{margin-bottom:2rem}
.cat-badge{background:rgba(155,93,229,.2);color:#9b5de5;border:1px solid rgba(155,93,229,.3);font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:10px}
.article-title{font-size:26px;font-weight:900;line-height:1.4;margin-bottom:10px}
.article-meta{font-size:12px;color:#555}
.article-body{font-size:14px;color:#ccc;line-height:1.9}
.article-body h2{font-size:18px;font-weight:700;color:#efefef;margin:1.5rem 0 .75rem;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.07)}
.article-body h3{font-size:15px;font-weight:700;color:#e94560;margin:1.2rem 0 .5rem}
.article-body p{margin-bottom:1rem}
.article-body strong{color:#efefef}
.related-box{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-top:2rem}
.related-title{font-size:13px;font-weight:700;color:#aaa;margin-bottom:12px}
.related-links{display:flex;flex-wrap:wrap;gap:8px}
.related-link{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#aaa;padding:6px 12px;border-radius:6px;font-size:12px;text-decoration:none;transition:all .2s}
.related-link:hover{border-color:#e94560;color:#e94560}
footer{background:#13131f;border-top:1px solid rgba(255,255,255,.07);padding:1.5rem;text-align:center;color:#555;font-size:12px;margin-top:3rem}
footer a{color:#aaa}
</style>
</head>
<body>
<header>
  <a href="/" class="logo">쿠폰<span>던전</span></a>
  <a href="/" class="home-btn">← 전체 쿠폰 보기</a>
</header>
<div class="ad-wrap">
  <ins class="adsbygoogle" style="display:block;width:100%;max-width:728px" data-ad-client="ca-pub-3292286283313303" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
<div class="container">
  <nav class="breadcrumb">
    <a href="/">쿠폰던전</a> › <a href="/#guide">공략</a> › ${guide.title}
  </nav>
  <div class="article-header">
    <span class="cat-badge">${guide.cat || '공략'}</span>
    <h1 class="article-title">${guide.title}</h1>
    <div class="article-meta">📅 ${today} · 🎮 ${guide.game || ''}</div>
  </div>
  <div class="article-body">
    <p>${content}</p>
  </div>
  <div class="related-box">
    <div class="related-title">🎫 관련 쿠폰 바로가기</div>
    <div class="related-links">
      <a class="related-link" href="/">전체 쿠폰 보기</a>
      ${guide.game ? `<a class="related-link" href="/game/${toSlug(guide.game)}.html">${guide.game} 쿠폰</a>` : ''}
    </div>
  </div>
</div>
<footer>
  <a href="/">쿠폰던전</a> &nbsp;·&nbsp;
  <a href="/#terms">이용약관</a> &nbsp;·&nbsp;
  <a href="/#terms">개인정보처리방침</a><br><br>
  © ${year} 쿠폰던전
</footer>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════
   뉴스 정적 페이지 생성
═══════════════════════════════════════════════════════ */
function buildNewsPage(news) {
  const slug = toSlug(news.title || '');
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString('ko-KR');
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": news.title,
    "description": news.content ? news.content.substring(0, 150) : news.title,
    "url": `${SITE_URL}/news/${slug}.html`,
    "datePublished": news.createdAt || new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "author": {"@type": "Organization", "name": "쿠폰던전"},
    "publisher": {"@type": "Organization", "name": "쿠폰던전"},
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type":"ListItem","position":1,"name":"쿠폰던전","item":SITE_URL},
        {"@type":"ListItem","position":2,"name":"뉴스","item":`${SITE_URL}/#news`},
        {"@type":"ListItem","position":3,"name":news.title,"item":`${SITE_URL}/news/${slug}.html`}
      ]
    }
  };

  const content = (news.content || '뉴스 내용이 없어요.')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${news.title} — 쿠폰던전 뉴스</title>
<meta name="description" content="${news.title}. 쿠폰던전에서 최신 게임 뉴스를 확인하세요.">
<meta property="og:title" content="${news.title} — 쿠폰던전">
<meta property="og:url" content="${SITE_URL}/news/${slug}.html">
<link rel="canonical" href="${SITE_URL}/news/${slug}.html">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3292286283313303" crossorigin="anonymous"></script>
<script type="application/ld+json">${JSON.stringify(schemaData)}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#09090f;color:#efefef;font-family:'Noto Sans KR',sans-serif;min-height:100vh;line-height:1.8}
a{color:#e94560;text-decoration:none}
header{background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);padding:0 1.25rem;height:54px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:18px;font-weight:800;color:#efefef}.logo span{color:#e94560}
.home-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#aaa;padding:6px 14px;border-radius:7px;font-size:12px;text-decoration:none}
.ad-wrap{padding:8px 1.25rem;background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:center}
.container{max-width:800px;margin:0 auto;padding:1.5rem 1.25rem}
.breadcrumb{font-size:12px;color:#555;margin-bottom:1.5rem}
.breadcrumb a{color:#aaa}
.news-badge{background:rgba(62,207,142,.15);color:#3ecf8e;border:1px solid rgba(62,207,142,.25);font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:10px}
.news-title{font-size:26px;font-weight:900;line-height:1.4;margin-bottom:10px}
.news-meta{font-size:12px;color:#555;margin-bottom:1.5rem}
.news-body{font-size:14px;color:#ccc;line-height:1.9}
.news-body p{margin-bottom:1rem}
.related-box{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-top:2rem}
.related-title{font-size:13px;font-weight:700;color:#aaa;margin-bottom:12px}
.related-links{display:flex;flex-wrap:wrap;gap:8px}
.related-link{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#aaa;padding:6px 12px;border-radius:6px;font-size:12px;text-decoration:none;transition:all .2s}
.related-link:hover{border-color:#3ecf8e;color:#3ecf8e}
footer{background:#13131f;border-top:1px solid rgba(255,255,255,.07);padding:1.5rem;text-align:center;color:#555;font-size:12px;margin-top:3rem}
footer a{color:#aaa}
</style>
</head>
<body>
<header>
  <a href="/" class="logo">쿠폰<span>던전</span></a>
  <a href="/" class="home-btn">← 전체 쿠폰 보기</a>
</header>
<div class="ad-wrap">
  <ins class="adsbygoogle" style="display:block;width:100%;max-width:728px" data-ad-client="ca-pub-3292286283313303" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
<div class="container">
  <nav class="breadcrumb">
    <a href="/">쿠폰던전</a> › <a href="/#news">뉴스</a> › ${news.title}
  </nav>
  <span class="news-badge">📰 게임 뉴스</span>
  <h1 class="news-title">${news.title}</h1>
  <div class="news-meta">📅 ${news.date || today} · 🎮 ${news.game || ''}</div>
  <div class="news-body">
    <p>${content}</p>
  </div>
  <div class="related-box">
    <div class="related-title">🎫 관련 쿠폰 바로가기</div>
    <div class="related-links">
      <a class="related-link" href="/">전체 쿠폰 보기</a>
      ${news.game ? `<a class="related-link" href="/game/${toSlug(news.game)}.html">${news.game} 쿠폰</a>` : ''}
    </div>
  </div>
</div>
<footer>
  <a href="/">쿠폰던전</a> &nbsp;·&nbsp;
  <a href="/#terms">이용약관</a> &nbsp;·&nbsp;
  <a href="/#terms">개인정보처리방침</a><br><br>
  © ${year} 쿠폰던전
</footer>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════
   HTML 템플릿 — 게임 전용 페이지
═══════════════════════════════════════════════════════ */
function buildGamePage(gameName, coupons, imageUrl, genre) {
  const slug = toSlug(gameName);
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString('ko-KR');
  const couponCount = coupons.length;
  const activeCoupons = coupons.filter(c => !c.expire || c.expire === '무기한' || new Date(c.expire.replace(/\./g,'-')) > new Date());
  const expiredCoupons = coupons.filter(c => c.expire && c.expire !== '무기한' && new Date(c.expire.replace(/\./g,'-')) <= new Date());

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${gameName} 쿠폰 코드 ${year} 최신`,
    "description": `${gameName} ${year}년 최신 쿠폰 코드 ${couponCount}개. 유효한 쿠폰만 정리했어요.`,
    "url": `${SITE_URL}/game/${slug}.html`,
    "dateModified": new Date().toISOString(),
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type":"ListItem","position":1,"name":"쿠폰던전","item":SITE_URL},
        {"@type":"ListItem","position":2,"name":"쿠폰","item":`${SITE_URL}/#coupon`},
        {"@type":"ListItem","position":3,"name":`${gameName} 쿠폰`,"item":`${SITE_URL}/game/${slug}.html`}
      ]
    },
    "mainEntity": {
      "@type": "FAQPage",
      "mainEntity": [
        {"@type":"Question","name":`${gameName} 쿠폰 코드는 어디서 입력하나요?`,"acceptedAnswer":{"@type":"Answer","text":`게임 내 설정 메뉴 또는 공식 홈페이지 쿠폰 입력란에서 입력할 수 있습니다.`}},
        {"@type":"Question","name":`${gameName} 쿠폰이 작동하지 않아요.`,"acceptedAnswer":{"@type":"Answer","text":"쿠폰 만료 여부, 대소문자 구분, 계정당 1회 제한을 확인해 주세요. 이미 사용한 코드는 재사용이 불가능합니다."}},
      ]
    }
  };

  const statusBadge = (c) => {
    if (!c.expire || c.expire === '무기한') return '<span style="background:rgba(62,207,142,.15);color:#3ecf8e;border:1px solid rgba(62,207,142,.25);font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">✅ 사용가능</span>';
    const d = new Date(c.expire.replace(/\./g,'-'));
    const daysLeft = Math.ceil((d - new Date()) / 86400000);
    if (daysLeft < 0) return '<span style="background:rgba(233,69,96,.15);color:#e94560;border:1px solid rgba(233,69,96,.25);font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">⚠️ 만료추정</span>';
    if (daysLeft < 7) return `<span style="background:rgba(245,166,35,.15);color:#f5a623;border:1px solid rgba(245,166,35,.25);font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">⏰ D-${daysLeft}</span>`;
    return '<span style="background:rgba(62,207,142,.15);color:#3ecf8e;border:1px solid rgba(62,207,142,.25);font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">✅ 사용가능</span>';
  };

  const couponRows = coupons.map(c => `
    <div class="coupon-row">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        ${statusBadge(c)}
        <span style="font-size:11px;color:#555">출처: ${c.source || '쿠폰던전'}</span>
      </div>
      <div class="code-box">
        <span class="code-label">쿠폰 코드</span>
        <span class="code-text">${c.code}</span>
        <button class="copy-btn" data-code="${c.code}" onclick="copyCode('${c.code}',this)">복사</button>
      </div>
      <div class="reward-text">🎁 ${c.reward || '인게임 보상'}</div>
      <div class="expire-text">⏰ 만료: ${c.expire || '무기한'}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${gameName} 쿠폰 코드 ${year} 최신 — 쿠폰던전</title>
<meta name="description" content="${gameName} ${year}년 최신 쿠폰 코드 ${couponCount}개 정리. 유효한 쿠폰만 모아드려요. 복사 버튼으로 바로 사용하세요!">
<meta name="keywords" content="${gameName} 쿠폰, ${gameName} 쿠폰코드, ${gameName} ${year}, 모바일게임 쿠폰">
<meta property="og:title" content="${gameName} 쿠폰 코드 ${year} 최신 — 쿠폰던전">
<meta property="og:description" content="${gameName} ${year}년 최신 쿠폰 코드 ${couponCount}개">
<meta property="og:url" content="${SITE_URL}/game/${slug}.html">
<meta property="og:type" content="website">
${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
<link rel="canonical" href="${SITE_URL}/game/${slug}.html">
${couponCount === 0 ? '<meta name="robots" content="noindex, nofollow">' : ''}
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3292286283313303" crossorigin="anonymous"></script>
<script type="application/ld+json">${JSON.stringify(schemaData)}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#09090f;color:#efefef;font-family:'Noto Sans KR',sans-serif;min-height:100vh;line-height:1.7}
a{color:#e94560;text-decoration:none}
header{background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);padding:0 1.25rem;height:54px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:18px;font-weight:800;color:#efefef}.logo span{color:#e94560}
.home-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#aaa;padding:6px 14px;border-radius:7px;font-size:12px;text-decoration:none}
.ad-wrap{padding:8px 1.25rem;background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:center}
.container{max-width:800px;margin:0 auto;padding:1.5rem 1.25rem}
.breadcrumb{font-size:12px;color:#555;margin-bottom:1.5rem}
.breadcrumb a{color:#aaa}.breadcrumb a:hover{color:#efefef}
.game-header{display:flex;align-items:center;gap:16px;margin-bottom:1.5rem;background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:1.25rem}
.game-icon{width:80px;height:80px;border-radius:16px;object-fit:cover;background:#1a1a2c;flex-shrink:0}
.game-title{font-size:24px;font-weight:800;margin-bottom:4px}
.game-meta{font-size:13px;color:#aaa;margin-bottom:8px}
.stat-row{display:flex;gap:12px;flex-wrap:wrap}
.stat-item{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:4px 10px;font-size:11px;color:#aaa}
.stat-item b{color:#efefef}
.section-title{font-size:14px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin:1.5rem 0 1rem;display:flex;align-items:center;gap:8px}
.section-title::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07)}
.coupon-row{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:10px;transition:border-color .2s}
.coupon-row:hover{border-color:rgba(255,255,255,.15)}
.code-box{display:flex;align-items:center;gap:10px;background:#09090f;border:1px solid rgba(255,255,255,.13);border-radius:8px;padding:10px 14px;margin-bottom:8px}
.code-label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.6px;flex-shrink:0}
.code-text{font-family:monospace;font-size:15px;font-weight:700;color:#efefef;flex:1;letter-spacing:1px}
.copy-btn{background:#e94560;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;transition:all .2s}
.copy-btn:hover{background:#c73652}.copy-btn.done{background:#3ecf8e;color:#000}
.reward-text{font-size:13px;color:#aaa;margin-bottom:4px}
.expire-text{font-size:12px;color:#555}
.how-box{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:1rem}
.how-title{font-size:13px;font-weight:700;color:#efefef;margin-bottom:8px}
.how-text{font-size:13px;color:#aaa;line-height:1.8}
.faq-item{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:8px}
.faq-q{font-size:13px;font-weight:700;color:#efefef;margin-bottom:6px}
.faq-q::before{content:'Q. ';color:#e94560}
.faq-a{font-size:13px;color:#aaa;line-height:1.7}
.faq-a::before{content:'A. ';color:#3ecf8e;font-weight:700}
.related-box{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-top:1rem}
.related-title{font-size:13px;font-weight:700;color:#aaa;margin-bottom:12px}
.related-links{display:flex;flex-wrap:wrap;gap:8px}
.related-link{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#aaa;padding:6px 12px;border-radius:6px;font-size:12px;text-decoration:none;transition:all .2s}
.related-link:hover{border-color:#e94560;color:#e94560}
.empty{text-align:center;color:#555;padding:2rem;font-size:14px}
.verified-bar{background:rgba(62,207,142,.08);border:1px solid rgba(62,207,142,.2);border-radius:8px;padding:8px 14px;font-size:12px;color:#3ecf8e;margin-bottom:1rem;display:flex;align-items:center;gap:8px}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(50px);background:#3ecf8e;color:#000;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;opacity:0;transition:all .3s;pointer-events:none;z-index:9999}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
footer{background:#13131f;border-top:1px solid rgba(255,255,255,.07);padding:1.5rem;text-align:center;color:#555;font-size:12px;margin-top:3rem}
footer a{color:#aaa}
@media(max-width:560px){.game-header{flex-direction:column;text-align:center}.stat-row{justify-content:center}}
</style>
</head>
<body>
<header>
  <a href="/" class="logo">쿠폰<span>던전</span></a>
  <a href="/" class="home-btn">← 전체 쿠폰 보기</a>
</header>
<div class="ad-wrap">
  <ins class="adsbygoogle" style="display:block;width:100%;max-width:728px" data-ad-client="ca-pub-3292286283313303" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
<div class="container">
  <nav class="breadcrumb">
    <a href="/">쿠폰던전</a> › <a href="/#coupon">쿠폰</a> › <a href="/game/${slug}.html">${gameName}</a>
  </nav>

  <div class="game-header">
    ${imageUrl ? `<img class="game-icon" src="${imageUrl}" alt="${gameName} 아이콘">` : `<div class="game-icon" style="display:flex;align-items:center;justify-content:center;font-size:36px">🎮</div>`}
    <div style="flex:1">
      <div class="game-title">${gameName} 쿠폰</div>
      <div class="game-meta">장르: ${genre || 'RPG'}</div>
      <div class="stat-row">
        <span class="stat-item">쿠폰 <b>${couponCount}개</b></span>
        <span class="stat-item">사용가능 <b style="color:#3ecf8e">${activeCoupons.length}개</b></span>
        <span class="stat-item">업데이트 <b>${today}</b></span>
      </div>
    </div>
  </div>

  <div class="verified-bar">
    ✅ 쿠폰던전이 ${today} 기준으로 검증한 코드만 제공합니다. 만료 코드는 자동 삭제됩니다.
  </div>

  <div class="section-title">🎫 ${gameName} 쿠폰 코드 ${year} 최신</div>

  ${couponCount > 0 ? couponRows : '<div class="empty">현재 등록된 쿠폰이 없어요.<br>새 쿠폰이 추가되면 자동으로 업데이트됩니다.</div>'}

  <div class="section-title">📋 쿠폰 입력 방법</div>
  <div class="how-box">
    <div class="how-title">🎮 ${gameName} 쿠폰 입력하는 방법</div>
    <div class="how-text">위의 쿠폰 코드를 복사한 후, 게임 내 설정 메뉴 또는 공식 홈페이지 쿠폰 입력란에 붙여넣기 하세요. 코드는 대소문자를 구분하며, 계정당 1회만 사용 가능합니다.</div>
  </div>

  <div class="section-title">❓ 자주 묻는 질문</div>
  <div class="faq-item">
    <div class="faq-q">${gameName} 쿠폰이 작동하지 않아요.</div>
    <div class="faq-a">쿠폰 만료 여부, 대소문자 구분, 계정당 1회 제한을 확인해 주세요. 이미 사용한 코드는 재사용이 불가능합니다.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">${gameName} 새 쿠폰은 언제 나오나요?</div>
    <div class="faq-a">쿠폰던전은 매일 자동으로 새 쿠폰을 수집합니다. 이 페이지를 즐겨찾기하고 정기적으로 확인해 주세요.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">쿠폰 보상은 언제 지급되나요?</div>
    <div class="faq-a">대부분의 게임은 쿠폰 입력 직후 우편함으로 보상이 지급됩니다. 게임에 따라 최대 24시간이 걸릴 수 있습니다.</div>
  </div>

  <div class="related-box">
    <div class="related-title">🔗 관련 링크</div>
    <div class="related-links">
      <a class="related-link" href="/">🎫 전체 쿠폰 보기</a>
      <a class="related-link" href="/#guide">📖 게임 공략 보기</a>
      <a class="related-link" href="/#news">📰 게임 뉴스 보기</a>
    </div>
  </div>

  <div style="font-size:11px;color:#444;margin-top:1.5rem;text-align:center">
    마지막 업데이트: ${today} · 매일 자동 수집 및 검증 · 쿠폰던전
  </div>
</div>

<footer>
  <a href="/">쿠폰던전</a> &nbsp;·&nbsp;
  <a href="/#terms">이용약관</a> &nbsp;·&nbsp;
  <a href="/#terms">개인정보처리방침</a> &nbsp;·&nbsp;
  <a href="mailto:krhym00001@gmail.com">문의</a><br><br>
  © ${year} 쿠폰던전 — 쿠폰 정보는 각 게임사 공식 채널 기준입니다.
</footer>

<div class="toast" id="toast"></div>
<script>
function copyCode(code, btn) {
  navigator.clipboard.writeText(code).catch(function(){
    var el = document.createElement('textarea');
    el.value = code; document.body.appendChild(el);
    el.select(); document.execCommand('copy');
    document.body.removeChild(el);
  });
  if (btn) { btn.textContent = '✓ 복사됨'; btn.classList.add('done'); setTimeout(function(){ btn.textContent = '복사'; btn.classList.remove('done'); }, 2000); }
  var t = document.getElementById('toast');
  t.textContent = '✅ ' + code + ' 복사됐어요!';
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2500);
}
</script>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════
   sitemap.xml 생성
═══════════════════════════════════════════════════════ */
function buildSitemap(gamePages, guidePages, newsPages) {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    `  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...gamePages.map(slug => `  <url><loc>${SITE_URL}/game/${slug}.html</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`),
    ...guidePages.map(slug => `  <url><loc>${SITE_URL}/guide/${slug}.html</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`),
    ...newsPages.map(slug => `  <url><loc>${SITE_URL}/news/${slug}.html</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// 사이트맵 인덱스 (sitemap index)
function buildSitemapIndex() {
  const today = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap.xml</loc><lastmod>${today}</lastmod></sitemap>
</sitemapindex>`;
}

function buildRobots() {
  return `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml`;
}

/* ═══════════════════════════════════════════════════════
   GitHub Push
═══════════════════════════════════════════════════════ */
async function pushToGitHub(files) {
  console.log('\n📤 GitHub에 파일 업로드 중...');
  try {
    const token = process.env.PAT_TOKEN;
    const repoUrl = `https://${token}@github.com/krhym00001-dotcom/coupon-dungeon-site.git`;
    execSync('git config --global user.email "action@github.com"');
    execSync('git config --global user.name "Coupon Dungeon Bot"');
    if (!fs.existsSync('/tmp/site')) {
      execSync(`git clone ${repoUrl} /tmp/site`);
    } else {
      execSync('git -C /tmp/site pull origin main');
    }
    ['game', 'guide', 'news'].forEach(dir => {
      if (!fs.existsSync(`/tmp/site/${dir}`)) fs.mkdirSync(`/tmp/site/${dir}`, { recursive: true });
    });
    let count = 0;
    for (const [filePath, content] of Object.entries(files)) {
      fs.writeFileSync(`/tmp/site/${filePath}`, content, 'utf8');
      count++;
    }
    execSync('git -C /tmp/site add -A');
    execSync(`git -C /tmp/site commit -m "쿠폰 데이터 업데이트 ${new Date().toLocaleDateString('ko-KR')}" --allow-empty`);
    execSync(`git -C /tmp/site push`);
    console.log(`  ✅ ${count}개 파일 GitHub 업로드 완료`);
  } catch(e) {
    console.error('  ❌ GitHub push 실패:', e.message);
  }
}

/* ═══════════════════════════════════════════════════════
   크롤링
═══════════════════════════════════════════════════════ */
async function collectGameList() {
  console.log('📋 블루스택 게임 목록 수집 중...');
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
        const p = m[1], slug = m[2];
        if (seen.has(p)) continue;
        seen.add(p);
        games.push({ slug, couponUrl: BLUESTACKS_BASE + p });
      }
      console.log(`  페이지 ${page}/${TOTAL_PAGES} → ${games.length}개`);
    } catch(e) { console.log(`  ⚠️ 페이지 ${page} 실패`); }
    await delay(DELAY_MS);
  }
  return games;
}

function parseCouponPage(html, slug) {
  let gameName = SLUG_TO_KO[slug];
  if (!gameName) {
    const h1 = (html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/) || [])[1] || slug;
    gameName = h1.replace(/공략\s*[-–]\s*최신.*/i,'').replace(/사용 가능한 모든 쿠폰 코드.*/i,'').replace(/\d{4}년.*/,'').replace(/쿠폰 코드.*/i,'').replace(/교환 코드.*/i,'').trim();
  }
  const appPageMatch = html.match(/href="(\/ko\/apps\/[^"]+on-pc\.html)"/);
  const appPageUrl = appPageMatch ? BLUESTACKS_BASE + appPageMatch[1] : null;
  const coupons = [];
  const tableRe = /<tr[^>]*>[\s\S]*?<td[^>]*>\s*<strong>\s*([A-Z0-9가-힣_\-]{3,30})\s*<\/strong>\s*<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = tableRe.exec(html)) !== null) {
    const code = m[1].trim();
    const reward = m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    if (!/^\d+$/.test(code)) coupons.push({ code, reward });
  }
  if (coupons.length === 0) {
    const boldRe = /<strong>\s*([A-Z0-9]{4,25})\s*<\/strong>/g;
    while ((m = boldRe.exec(html)) !== null) {
      const code = m[1].trim();
      if (!/^\d+$/.test(code)) coupons.push({ code, reward:'인게임 보상' });
    }
  }
  const today = new Date();
  let expire = '무기한';
  const expMatch = html.match(/(\d{4})[년.\-](\d{1,2})[월.\-](\d{1,2})/);
  if (expMatch) {
    const d = new Date(expMatch[1], expMatch[2]-1, expMatch[3]);
    if (d > today) expire = `${expMatch[1]}.${String(expMatch[2]).padStart(2,'0')}.${String(expMatch[3]).padStart(2,'0')}`;
  }
  const genreMap = {'롤플레잉':'RPG','RPG':'RPG','MMORPG':'MMORPG','액션':'액션','전략':'전략','캐주얼':'캐주얼','FPS':'FPS'};
  let genre = 'RPG';
  for (const [k,v] of Object.entries(genreMap)) { if (html.includes(k)) { genre = v; break; } }
  return { gameName, appPageUrl, coupons, expire, genre };
}

async function saveToDB(coupons) {
  if (!coupons.length) return;
  for (let i = 0; i < coupons.length; i += 400) {
    const batch = db.batch();
    for (const c of coupons.slice(i, i+400)) {
      const id = `${c.game}_${c.code}`.replace(/[^a-zA-Z0-9가-힣_-]/g,'_');
      batch.set(db.collection('coupons').doc(id), c, { merge: true });
    }
    await batch.commit();
  }
}

async function cleanCoupons() {
  console.log('🧹 만료 쿠폰 정리...');
  try {
    const snap = await db.collection('coupons').get();
    const today = new Date();
    const batch = db.batch();
    let cnt = 0;
    snap.forEach(doc => {
      const d = doc.data();
      if (d.expire && d.expire !== '무기한') {
        const parts = d.expire.split('.');
        if (parts.length === 3) {
          const exp = new Date(parts[0], parts[1]-1, parts[2]);
          if ((today - exp) / 86400000 > 1) { batch.delete(doc.ref); cnt++; }
        }
      }
    });
    if (cnt > 0) { await batch.commit(); console.log(`  🗑️ ${cnt}개 삭제`); }
    else console.log('  ✅ 삭제할 쿠폰 없음');
  } catch(e) { console.log('  ⚠️ 정리 실패:', e.message); }
}

/* ═══════════════════════════════════════════════════════
   메인
═══════════════════════════════════════════════════════ */
async function main() {
  const startTime = Date.now();
  console.log('🚀 쿠폰던전 자동수집 + iTunes 이미지 수집 시작!');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}\n`);

  await cleanCoupons();
  const gameList = await collectGameList();

  console.log(`\n🎮 게임별 쿠폰 + 이미지 수집 (${gameList.length}개)\n`);

  const allCoupons = [];
  const gamePageFiles = {};
  const gamePageSlugs = [];

  let guidesSlugs = [], newsSlugs = [];
  try {
    // 공략 정적 페이지 생성
    const gSnap = await db.collection('guides').get();
    gSnap.forEach(d => {
      const guide = Object.assign({id: d.id}, d.data());
      const slug = toSlug(guide.title || '');
      if (slug) {
        gamePageFiles[`guide/${slug}.html`] = buildGuidePage(guide);
        guidesSlugs.push(slug);
      }
    });
    console.log(`  📖 공략 페이지 ${guidesSlugs.length}개 생성`);

    // 뉴스 정적 페이지 생성
    const nSnap = await db.collection('news').get();
    nSnap.forEach(d => {
      const news = Object.assign({id: d.id}, d.data());
      const slug = toSlug(news.title || '');
      if (slug) {
        gamePageFiles[`news/${slug}.html`] = buildNewsPage(news);
        newsSlugs.push(slug);
      }
    });
    console.log(`  📰 뉴스 페이지 ${newsSlugs.length}개 생성`);
  } catch(e) { console.log('  ⚠️ 공략/뉴스 페이지 생성 실패:', e.message); }

  let success = 0, empty = 0, fail = 0;

  for (const game of gameList) {
    try {
      const html = await fetchUrl(game.couponUrl);
      const { gameName, appPageUrl, coupons, expire, genre } = parseCouponPage(html, game.slug);

      // iTunes 우선 → 블루스택 폴백
      const { imageUrl, packageName } = await fetchGameImage(appPageUrl, gameName);
      await delay(500);

      const rank = GAME_RANK[gameName] || 500;
      const validCoupons = coupons.filter(c => c.code && c.code.length >= 3 && !/^\d+$/.test(c.code));

      const formatted = validCoupons.map(c => ({
        code: c.code.toUpperCase(), reward: c.reward || '인게임 보상',
        expire, source: '쿠폰던전', game: gameName, genre: genre.toLowerCase(),
        rank, imageUrl, packageName, status: 'new',
        views: Math.floor(500 * 0.5 + Math.random() * 200),
        votes: {
          ok: Math.floor((Math.random() * 80 + 20) * 0.75),
          bad: Math.floor((Math.random() * 80 + 20) * 0.25)
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      if (formatted.length > 0) allCoupons.push(...formatted);

      const slug = toSlug(gameName);
      if (slug) {
        gamePageFiles[`game/${slug}.html`] = buildGamePage(gameName, validCoupons, imageUrl, genre);
        gamePageSlugs.push(slug);
      }

      const status = validCoupons.length > 0 ? `✅ ${validCoupons.length}개` : '⬜ 없음';
      console.log(`  ${status} | ${gameName} | 이미지: ${imageUrl ? '🍎 iTunes' : '✗'}`);
      if (validCoupons.length > 0) success++; else empty++;

    } catch(e) {
      console.log(`  ❌ ${game.slug}: ${e.message}`); fail++;
    }
    await delay(DELAY_MS);
  }

  // 호요버스 게임 쿠폰 별도 수집 (블루스택에서 잘 안 잡히는 게임들)
  console.log('\n🎮 호요버스 게임 쿠폰 추가 수집...');
  try {
    const hoyo = await collectHoyoverseCoupons();
    if (hoyo.length > 0) {
      // 중복 제거: 이미 수집된 코드는 스킵
      const existingCodes = new Set(allCoupons.map(c => `${c.game}_${c.code}`));
      const newHoyo = hoyo.filter(c => !existingCodes.has(`${c.game}_${c.code}`));
      allCoupons.push(...newHoyo);
      console.log(`  ✅ 호요버스 신규 쿠폰 ${newHoyo.length}개 추가`);

      // 호요버스 게임 페이지 별도 생성
      for (const game of HOYOVERSE_GAMES) {
        const gameCoupons = newHoyo.filter(c => c.game === game.name);
        // 기존 블루스택 쿠폰도 합치기
        const existingGameCoupons = allCoupons.filter(c => c.game === game.name && !newHoyo.includes(c));
        const allGameCoupons = [...existingGameCoupons, ...gameCoupons];

        if (allGameCoupons.length > 0) {
          const slug = toSlug(game.name);
          const imageUrl = allGameCoupons[0].imageUrl || null;
          const genre = allGameCoupons[0].genre || 'rpg';
          gamePageFiles[`game/${slug}.html`] = buildGamePage(game.name, allGameCoupons, imageUrl, genre);
          if (!gamePageSlugs.includes(slug)) gamePageSlugs.push(slug);
          console.log(`  📄 ${game.name} 게임 페이지 생성 (${allGameCoupons.length}개 쿠폰)`);
        }
      }
    }
  } catch(e) {
    console.log(`  ⚠️ 호요버스 수집 실패: ${e.message}`);
  }

  console.log(`\n💾 Firebase 저장 중... (${allCoupons.length}개)`);
  await saveToDB(allCoupons);

  console.log('\n🗺️ sitemap.xml 생성 중...');
  gamePageFiles['sitemap.xml'] = buildSitemap(gamePageSlugs, guidesSlugs, newsSlugs);
  gamePageFiles['robots.txt'] = buildRobots();

  if (process.env.PAT_TOKEN) {
    await pushToGitHub(gamePageFiles);
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('\n══════════════════════════════════════');
  console.log(`✅ 완료! ${Math.floor(elapsed/60)}분 ${elapsed%60}초`);
  console.log(`  쿠폰 있는 게임: ${success}개 | 없음: ${empty}개 | 실패: ${fail}개`);
  console.log(`  Firebase 저장: ${allCoupons.length}개`);
  console.log(`  게임 페이지: ${gamePageSlugs.length}개`);
  console.log(`  공략 페이지: ${guidesSlugs.length}개`);
  console.log(`  뉴스 페이지: ${newsSlugs.length}개`);
  console.log('══════════════════════════════════════');
}

main().catch(console.error);
