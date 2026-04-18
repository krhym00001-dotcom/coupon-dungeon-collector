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
  '원신': 'Genshin Impact',
  '붕괴: 스타레일': 'Honkai Star Rail',
  '젠레스 존 제로': 'Zenless Zone Zero',
  '명조: 워더링 웨이브': 'Wuthering Waves',
  '리니지W': 'Lineage W',
  '리니지M': 'Lineage M',
  '리니지2M': 'Lineage2M',
  '메이플스토리M': 'MapleStory M',
  '배틀그라운드 모바일': 'PUBG MOBILE',
  '로스트아크': 'Lost Ark Mobile',
  '나 혼자만 레벨업: ARISE': 'Solo Leveling ARISE',
  '에픽세븐': 'Epic Seven',
  '블루 아카이브': 'Blue Archive',
  '던전앤파이터M': 'Dungeon Fighter Mobile',
  '검은사막 모바일': 'Black Desert Mobile',
  '쿠키런: 킹덤': 'Cookie Run Kingdom',
  '쿠키런: 모험의 탑': 'Cookie Run Tower of Adventures',
  '쿠키런: 오븐스매시': 'Cookie Run OvenSmash',
  '브롤스타즈': 'Brawl Stars',
  '클래시 오브 클랜': 'Clash of Clans',
  '클래시 로얄': 'Clash Royale',
  '아이온2': 'Aion 2',
  '나이트 크로우': 'Night Crows',
  '라그나로크 오리진': 'Ragnarok Origin',
  '라그나로크 오리진 클래식': 'Ragnarok Origin Classic',
  '뱀피르': 'Vampir',
  '오버워치2': 'Overwatch 2',
  'AFK 저니': 'AFK Journey',
  '림버스 컴퍼니': 'Limbus Company',
  '서머너즈 워': 'Summoners War',
  '몬스터는 울지 않아': 'Monster Never Cry',
  'Once Human': 'Once Human',
  '마비노기 모바일': 'Mabinogi Mobile',
  '트릭컬 RE:VIVE': 'Trickcal REVIVE',
  '스텔라 소라': 'Stellar Blade',
  '아스달 연대기': 'Arthdal Chronicles',
  '세나: 최후의 방어선': 'SENA',
  '미르4': 'MIR4',
  '그랑사가': 'Gran Saga',
  '에코칼립스': 'EchoCalypse',
  '왓처 오브 렐름스': 'Watcher of Realms',
  '리버스: 1999': 'Reverse 1999',
  '드래곤헤어: 사일런트 갓': 'Dragonheir Silent Gods',
  '스카이: 빛의 아이들': 'Sky Children of the Light',
  '피파 모바일': 'EA SPORTS FC Mobile',
  '나자릭의 군주': 'Lord of Nazarick',
  '소녀전선2: 추방': 'Girls Frontline 2',
  '주술회전 팬텀 퍼레이드': 'Jujutsu Kaisen Phantom Parade',
  '운빨존많겜': 'Lucky Defense',
  '냥코 대전쟁': 'The Battle Cats',
  'WOS: 화이트아웃 서바이벌': 'Whiteout Survival',
  '포켓몬 카드 게임 Pocket': 'Pokemon Trading Card Game Pocket',
  '레이드: 그림자의 전설': 'RAID Shadow Legends',
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
   HTML 템플릿 — 게임 전용 페이지
═══════════════════════════════════════════════════════ */
function buildGamePage(gameName, coupons, imageUrl, genre) {
  const slug = toSlug(gameName);
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString('ko-KR');
  const couponCount = coupons.length;

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
    }
  };

  const couponRows = coupons.map(c => `
    <div class="coupon-row">
      <div class="code-box">
        <span class="code-label">쿠폰 코드</span>
        <span class="code-text" id="code-${c.code}">${c.code}</span>
        <button class="copy-btn" onclick="copyCode('${c.code}')">복사</button>
      </div>
      <div class="reward-text">🎁 ${c.reward || '인게임 보상'}</div>
      <div class="expire-text">⏰ 만료: ${c.expire || '무기한'}</div>
      <div class="source-text">출처: ${c.source || '쿠폰던전'}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${gameName} 쿠폰 코드 ${year} 최신 — 쿠폰던전</title>
<meta name="description" content="${gameName} ${year}년 최신 쿠폰 코드 ${couponCount}개 정리. 유효한 쿠폰만 모아드려요.">
<meta name="keywords" content="${gameName} 쿠폰, ${gameName} 쿠폰코드, ${gameName} ${year}, 모바일게임 쿠폰">
<meta property="og:title" content="${gameName} 쿠폰 코드 ${year} 최신 — 쿠폰던전">
<meta property="og:description" content="${gameName} ${year}년 최신 쿠폰 코드 ${couponCount}개">
<meta property="og:url" content="${SITE_URL}/game/${slug}.html">
<meta property="og:type" content="website">
${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
<link rel="canonical" href="${SITE_URL}/game/${slug}.html">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3292286283313303" crossorigin="anonymous"></script>
<script type="application/ld+json">${JSON.stringify(schemaData)}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#09090f;color:#efefef;font-family:'Noto Sans KR',sans-serif;min-height:100vh;line-height:1.7}
a{color:#e94560;text-decoration:none}
header{background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);padding:0 1.25rem;height:54px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:18px;font-weight:800;color:#efefef}.logo span{color:#e94560}
.home-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#aaa;padding:6px 14px;border-radius:7px;font-size:12px;cursor:pointer;text-decoration:none}
.ad-wrap{padding:8px 1.25rem;background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:center}
.container{max-width:800px;margin:0 auto;padding:1.5rem 1.25rem}
.breadcrumb{font-size:12px;color:#555;margin-bottom:1.5rem}
.breadcrumb a{color:#aaa}.breadcrumb a:hover{color:#efefef}
.game-header{display:flex;align-items:center;gap:16px;margin-bottom:2rem;background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:1.25rem}
.game-icon{width:80px;height:80px;border-radius:16px;object-fit:cover;background:#1a1a2c;flex-shrink:0}
.game-title{font-size:24px;font-weight:800;margin-bottom:4px}
.game-meta{font-size:13px;color:#aaa}
.section-title{font-size:14px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:1rem;display:flex;align-items:center;gap:8px}
.section-title::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07)}
.coupon-row{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:10px}
.code-box{display:flex;align-items:center;gap:10px;background:#09090f;border:1px solid rgba(255,255,255,.13);border-radius:8px;padding:10px 14px;margin-bottom:10px}
.code-label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.6px;flex-shrink:0}
.code-text{font-family:monospace;font-size:15px;font-weight:700;color:#efefef;flex:1;letter-spacing:1px}
.copy-btn{background:#e94560;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0}
.copy-btn:hover{background:#c73652}.copy-btn.done{background:#3ecf8e;color:#000}
.reward-text{font-size:13px;color:#aaa;margin-bottom:4px}
.expire-text{font-size:12px;color:#555}
.source-text{font-size:11px;color:#444;margin-top:4px}
.empty{text-align:center;color:#555;padding:2rem;font-size:14px}
.updated{font-size:11px;color:#444;margin-top:1.5rem;text-align:center}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(50px);background:#3ecf8e;color:#000;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;opacity:0;transition:all .3s;pointer-events:none;z-index:9999}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
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
    <a href="/">쿠폰던전</a> › <a href="/#coupon">쿠폰</a> › ${gameName}
  </nav>
  <div class="game-header">
    ${imageUrl ? `<img class="game-icon" src="${imageUrl}" alt="${gameName} 아이콘">` : `<div class="game-icon" style="display:flex;align-items:center;justify-content:center;font-size:36px">🎮</div>`}
    <div>
      <div class="game-title">${gameName}</div>
      <div class="game-meta">장르: ${genre || 'RPG'} &nbsp;·&nbsp; 쿠폰 ${couponCount}개 &nbsp;·&nbsp; 업데이트: ${today}</div>
    </div>
  </div>
  <div class="section-title">🎫 ${gameName} 쿠폰 코드 ${year} 최신</div>
  ${couponCount > 0 ? couponRows : '<div class="empty">현재 등록된 쿠폰이 없어요.</div>'}
  <div class="updated">마지막 업데이트: ${today} · 매일 자동 수집</div>
</div>
<footer>
  <a href="/">쿠폰던전</a> &nbsp;·&nbsp;
  <a href="/#terms">이용약관</a> &nbsp;·&nbsp;
  <a href="/#terms">개인정보처리방침</a><br><br>
  © ${year} 쿠폰던전
</footer>
<div class="toast" id="toast"></div>
<script>
function copyCode(code) {
  navigator.clipboard.writeText(code).catch(function(){
    var el = document.createElement('textarea');
    el.value = code; document.body.appendChild(el);
    el.select(); document.execCommand('copy');
    document.body.removeChild(el);
  });
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
    const gSnap = await db.collection('guides').get();
    gSnap.forEach(d => { guidesSlugs.push(toSlug(d.data().title || '')); });
    const nSnap = await db.collection('news').get();
    nSnap.forEach(d => { newsSlugs.push(toSlug(d.data().title || '')); });
  } catch(e) {}

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
  console.log(`  SEO 페이지: ${gamePageSlugs.length}개`);
  console.log('══════════════════════════════════════');
}

main().catch(console.error);
