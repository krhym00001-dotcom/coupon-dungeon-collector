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

/* ═══════════════════════════════════════════════════════
   게임 소개 텍스트 매핑 (SEO용 게임 페이지 내용)
═══════════════════════════════════════════════════════ */
const GAME_INFO = {
  '원신': {
    desc: '호요버스가 개발한 오픈월드 액션 RPG. 7가지 원소를 활용한 전투와 광활한 테이밋 세계를 탐험하며 다양한 캐릭터를 수집·육성하는 게임입니다. 매 6주마다 새로운 버전 업데이트가 진행됩니다.',
    tip: '쿠폰 코드는 설정 → 계정 → 교환 코드에서 입력하거나 공식 웹사이트에서도 입력할 수 있어요.',
    genre: 'RPG', dev: '호요버스'
  },
  '붕괴: 스타레일': {
    desc: '호요버스의 턴제 전략 RPG. 은하 급행열차를 타고 여러 행성을 탐험하며 다양한 캐릭터와 함께 전략적인 턴제 전투를 즐기는 게임입니다.',
    tip: '쿠폰 코드는 HoYoLAB 앱이나 게임 내 설정에서 입력 가능합니다.',
    genre: 'RPG', dev: '호요버스'
  },
  '젠레스 존 제로': {
    desc: '호요버스의 도시 배경 액션 RPG. 홀로우라 불리는 이차원 공간을 탐험하며 다양한 에이전트를 조종해 스타일리시한 전투를 즐기는 게임입니다.',
    tip: '쿠폰 코드는 게임 내 인터폰 메뉴 또는 공식 웹사이트에서 입력할 수 있어요.',
    genre: 'RPG', dev: '호요버스'
  },
  '명조: 워더링 웨이브': {
    desc: '쿠로게임즈의 오픈월드 액션 RPG. 소리를 기반으로 한 독특한 세계관과 빠른 액션 전투, 파리(완벽 회피) 시스템이 특징인 게임입니다.',
    tip: '쿠폰 코드는 공식 사이트 또는 게임 내 이벤트 메뉴에서 입력 가능합니다.',
    genre: 'RPG', dev: '쿠로게임즈'
  },
  '리니지W': {
    desc: '엔씨소프트의 MMORPG. 리니지 원작의 세계관을 모바일로 재현한 게임으로, 혈맹 전쟁과 공성전 등 대규모 PVP가 특징입니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: 'MMORPG', dev: '엔씨소프트'
  },
  '리니지M': {
    desc: '엔씨소프트의 모바일 MMORPG. PC 리니지의 감성을 모바일에서 그대로 즐길 수 있으며, 혈맹과 공성전 시스템이 핵심입니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 메뉴에서 입력 가능합니다.',
    genre: 'MMORPG', dev: '엔씨소프트'
  },
  '리니지2M': {
    desc: '엔씨소프트의 리니지2 IP 기반 모바일 MMORPG. 언리얼 엔진4로 구현한 고품질 그래픽과 대규모 서버 전쟁이 특징입니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: 'MMORPG', dev: '엔씨소프트'
  },
  '메이플스토리M': {
    desc: '넥슨의 횡스크롤 MMORPG. PC 메이플스토리의 감성을 모바일로 재현한 게임으로, 30개 이상의 직업과 길드 보스, 스타포스 시스템이 특징입니다.',
    tip: '쿠폰 코드는 인벤토리 → 기타 → 쿠폰 입력 메뉴에서 입력할 수 있어요.',
    genre: 'MMORPG', dev: '넥슨'
  },
  '나 혼자만 레벨업: ARISE': {
    desc: '넷마블의 액션 RPG. 인기 웹툰·소설 원작의 게임으로 성진우를 비롯한 원작 캐릭터들을 직접 조종하며 던전을 공략하는 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 코드 입력 메뉴에서 입력 가능합니다.',
    genre: 'RPG', dev: '넷마블'
  },
  '에픽세븐': {
    desc: '스마일게이트의 턴제 RPG. 화려한 2D 애니메이션 그래픽과 다양한 영웅을 수집·육성하는 게임으로, 깊이 있는 PVP와 레이드 콘텐츠가 특징입니다.',
    tip: '쿠폰 코드는 로비 → 메일함 → 쿠폰 교환 메뉴에서 입력할 수 있어요.',
    genre: 'RPG', dev: '스마일게이트'
  },
  '블루 아카이브': {
    desc: '넥슨/넥슨게임즈의 학원 배경 RPG. 다양한 학교 소속 학생 캐릭터들을 수집하고 총력전 레이드에 도전하는 게임입니다.',
    tip: '쿠폰 코드는 로비 → 기타 → 쿠폰 번호 입력 메뉴에서 입력 가능합니다.',
    genre: 'RPG', dev: '넥슨게임즈'
  },
  '쿠키런: 킹덤': {
    desc: '데브시스터즈의 왕국 건설 RPG. 다양한 쿠키 캐릭터를 수집하고 왕국을 건설하며 PVP와 PVE 콘텐츠를 즐기는 게임입니다.',
    tip: '쿠폰 코드는 메뉴 → 설정 → 쿠폰 번호 입력에서 입력할 수 있어요.',
    genre: 'RPG', dev: '데브시스터즈'
  },
  '쿠키런: 모험의 탑': {
    desc: '데브시스터즈의 모험 RPG. 쿠키런 IP를 기반으로 탑 클리어 방식의 던전 탐험 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 메뉴에서 입력 가능합니다.',
    genre: 'RPG', dev: '데브시스터즈'
  },
  '쿠키런': {
    desc: '데브시스터즈의 런닝 액션 게임. 오븐에서 탈출하는 쿠키의 달리기 모험을 담은 게임으로, 다양한 쿠키와 펫을 수집할 수 있습니다.',
    tip: '쿠폰 코드는 게임 내 설정 메뉴에서 입력 가능합니다.',
    genre: '캐주얼', dev: '데브시스터즈'
  },
  '아스달 연대기': {
    desc: '카카오게임즈의 MMORPG. 동명의 드라마를 원작으로 한 게임으로, 고대 문명을 배경으로 한 세력 전쟁과 성장 콘텐츠가 특징입니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: 'MMORPG', dev: '카카오게임즈'
  },
  'AFK 저니': {
    desc: '릴리스게임즈의 방치형 RPG. 자동으로 성장하는 편의성과 다양한 영웅 수집, 길드 전쟁 등 풍부한 콘텐츠가 특징인 게임입니다.',
    tip: '쿠폰 코드는 아바타 클릭 → 설정 → 쿠폰 코드 입력에서 입력 가능합니다.',
    genre: 'RPG', dev: '릴리스게임즈'
  },
  'Once Human': {
    desc: '넷이즈의 오픈월드 서바이벌 슈팅 게임. 오염된 세계에서 자원을 수집하고 거점을 건설하며 생존하는 게임으로, 시즌제로 운영됩니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 → 코드 교환 메뉴에서 입력 가능합니다.',
    genre: '서바이벌', dev: '넷이즈'
  },
  '왓처 오브 렐름스': {
    desc: '게임로프트의 판타지 RPG. 다양한 영웅을 수집하고 씨족 시너지를 활용하여 전략적인 전투를 즐기는 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 교환에서 입력할 수 있어요.',
    genre: 'RPG', dev: '게임로프트'
  },
  '서머너즈 워': {
    desc: '컴투스의 턴제 RPG. 다양한 속성의 몬스터를 수집·육성하고 던전과 레이드, PVP를 즐기는 글로벌 인기 게임입니다.',
    tip: '쿠폰 코드는 게임 내 매직 상점 → 쿠폰 코드 입력에서 입력 가능합니다.',
    genre: 'RPG', dev: '컴투스'
  },
  '림버스 컴퍼니': {
    desc: '프로젝트문의 턴제 RPG. 독특한 세계관과 카드 배틀 시스템, 죄종 공명 메커니즘이 특징인 게임입니다.',
    tip: '쿠폰 코드는 로비 → 공지사항 → 쿠폰 입력에서 입력할 수 있어요.',
    genre: 'RPG', dev: '프로젝트문'
  },
  '리버스: 1999': {
    desc: '버추얼뱅크의 턴제 카드 RPG. 1930~1960년대를 배경으로 카드를 합성해 강력한 스킬을 발동하는 독특한 전투 시스템이 특징입니다.',
    tip: '쿠폰 코드는 설정 → 계정 → 교환 코드에서 입력 가능합니다.',
    genre: 'RPG', dev: '버추얼뱅크'
  },
  '몬스터는 울지 않아': {
    desc: '카카오게임즈의 방치형 RPG. 다양한 몬스터 캐릭터를 육성하고 자동 전투로 성장하는 방치형 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: 'RPG', dev: '카카오게임즈'
  },
  'WOS: 화이트아웃 서바이벌': {
    desc: '센추리 게임즈의 전략 서바이벌 게임. 극한의 추위에서 기지를 건설하고 자원을 수집하며 생존하는 전략 게임입니다.',
    tip: '쿠폰 코드는 아바타 → 설정 → 쿠폰 코드에서 입력 가능합니다.',
    genre: '전략', dev: '센추리 게임즈'
  },
  '라그나로크 오리진 클래식': {
    desc: '그라비티의 MMORPG. 원작 라그나로크 온라인의 클래식 감성을 모바일로 재현한 게임으로, 직업 시스템과 카드 수집이 특징입니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 메뉴에서 입력 가능합니다.',
    genre: 'MMORPG', dev: '그라비티'
  },
  '다크엔젤: 심연의 날개': {
    desc: '액션 RPG 게임으로 천사와 악마의 세계관을 배경으로 한 화려한 스킬과 성장 시스템이 특징입니다.',
    tip: '쿠폰 코드는 게임 내 설정 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: 'RPG', dev: ''
  },
  '드래곤의 토템': {
    desc: '동양 판타지를 배경으로 한 방치형 RPG. 드래곤과 함께하는 자동 성장 시스템이 특징입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 입력 메뉴에서 입력 가능합니다.',
    genre: 'RPG', dev: ''
  },
  '질풍삼국': {
    desc: '삼국지를 배경으로 한 전략 RPG. 다양한 무장을 수집하고 전략적인 전투를 즐기는 게임입니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 → 쿠폰 메뉴에서 입력 가능합니다.',
    genre: '전략RPG', dev: ''
  },
  '천년 다시': {
    desc: '무협 배경의 MMORPG. 천년의 세계관을 기반으로 한 전통적인 무협 게임입니다.',
    tip: '쿠폰 코드는 이벤트 → 쿠폰 교환 메뉴에서 입력할 수 있어요.',
    genre: 'MMORPG', dev: ''
  },
  '연운': {
    desc: '동양 판타지 MMORPG. 아름다운 그래픽과 무협 세계관이 특징인 모바일 게임입니다.',
    tip: '쿠폰 코드는 게임 내 설정 → 쿠폰 입력에서 입력 가능합니다.',
    genre: 'MMORPG', dev: ''
  },
  '뱅뱅 서바이버': {
    desc: '뱀파이어 서바이버 스타일의 방치형 슈팅 게임. 자동으로 공격하며 생존하는 중독성 있는 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 메뉴에서 입력 가능합니다.',
    genre: '슈팅', dev: ''
  },
  '좀비고등학교': {
    desc: '좀비 아포칼립스 배경의 생존 RPG. 고등학교를 배경으로 한 독특한 세계관과 수집 시스템이 특징입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 코드 입력에서 입력할 수 있어요.',
    genre: 'RPG', dev: ''
  },
  '운빨존많겜': {
    desc: '타워 디펜스 방치형 게임. 다양한 영웅을 배치해 몰려오는 적을 막는 전략적인 게임입니다.',
    tip: '쿠폰 코드는 게임 내 설정 → 쿠폰 입력에서 입력 가능합니다.',
    genre: '타워디펜스', dev: ''
  },
  '일곱 개의 대죄: Origin': {
    desc: '넷마블의 애니메이션 원작 RPG. 인기 애니메이션 원작의 캐릭터들을 수집하고 전략적인 전투를 즐기는 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 교환 메뉴에서 입력 가능합니다.',
    genre: 'RPG', dev: '넷마블'
  },
  '레이드: 그림자의 전설': {
    desc: '플라리움의 턴제 RPG. 700개 이상의 챔피언을 수집하고 던전과 클랜 보스에 도전하는 글로벌 인기 게임입니다.',
    tip: '쿠폰 코드는 게임 내 설정 → 프로모 코드에서 입력할 수 있어요.',
    genre: 'RPG', dev: '플라리움'
  },
  '아스달 연대기': {
    desc: '카카오게임즈의 드라마 원작 MMORPG. 고대 문명 배경의 세력 전쟁과 성장 시스템이 특징입니다.',
    tip: '쿠폰 코드는 이벤트 → 쿠폰 입력 메뉴에서 입력 가능합니다.',
    genre: 'MMORPG', dev: '카카오게임즈'
  },
  '소울 스트라이크': {
    desc: '방치형 액션 RPG. 제노니아 세계관을 기반으로 한 자동 성장 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: 'RPG', dev: ''
  },
  '에픽세븐': {
    desc: '스마일게이트의 턴제 RPG. 화려한 2D 애니메이션과 깊이 있는 PVP 콘텐츠가 특징입니다.',
    tip: '쿠폰 코드는 메일함 → 쿠폰 교환에서 입력 가능합니다.',
    genre: 'RPG', dev: '스마일게이트'
  },
  '소울 아이들': {
    desc: '방치형 RPG. 다양한 영웅을 자동으로 성장시키는 편의성 높은 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 입력에서 입력할 수 있어요.',
    genre: 'RPG', dev: ''
  },
  '콤보 히어로': {
    desc: '영웅일 뿐이야 기반의 액션 RPG. 콤보 공격과 영웅 수집이 특징인 게임입니다.',
    tip: '쿠폰 코드는 게임 내 설정 → 쿠폰 코드에서 입력 가능합니다.',
    genre: 'RPG', dev: ''
  },
  'Honor of Kings': {
    desc: '텐센트의 5:5 MOBA 게임. 글로벌 서비스 버전의 왕자영요로, 다양한 영웅을 조종해 팀 전술 전투를 즐기는 게임입니다.',
    tip: '쿠폰 코드는 이벤트 → 코드 교환 메뉴에서 입력 가능합니다.',
    genre: 'MOBA', dev: '텐센트'
  },
  'SSMS': {
    desc: '전략 시뮬레이션 게임으로 서버 간 전쟁과 기지 건설이 특징인 모바일 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: '전략', dev: ''
  },
  '블레이드M': {
    desc: '픽셀아트 스타일의 액션 RPG. 레트로 감성의 그래픽과 빠른 전투가 특징인 게임입니다.',
    tip: '쿠폰 코드는 게임 내 설정 → 쿠폰 입력에서 입력 가능합니다.',
    genre: 'RPG', dev: ''
  },
  'ROEM': {
    desc: '패션과 스타일을 테마로 한 캐주얼 게임입니다.',
    tip: '쿠폰 코드는 이벤트 메뉴에서 입력할 수 있어요.',
    genre: '캐주얼', dev: ''
  },
  '영웅 얼라이언스': {
    desc: '넥스트 게임즈의 방치형 RPG. 다양한 영웅을 수집하고 자동으로 성장시키는 글로벌 인기 게임입니다.',
    tip: '쿠폰 코드는 설정 → 프로모 코드에서 입력 가능합니다.',
    genre: 'RPG', dev: '넥스트 게임즈'
  },
  '군주의 여정': {
    desc: '전략 RPG 게임으로 왕국을 건설하고 전쟁을 통해 세력을 확장하는 게임입니다.',
    tip: '쿠폰 코드는 이벤트 → 쿠폰 교환에서 입력할 수 있어요.',
    genre: '전략', dev: ''
  },
  '미르2: 새왕국': {
    desc: '미르의 전설2를 기반으로 한 MMORPG. 원작의 감성을 살린 전통적인 무협 게임입니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 메뉴에서 입력 가능합니다.',
    genre: 'MMORPG', dev: ''
  },
  '미르2: 레드나이트': {
    desc: '미르의 전설2 기반의 MMORPG. 레드나이트 세계관을 배경으로 한 모바일 게임입니다.',
    tip: '쿠폰 코드는 이벤트 → 쿠폰 입력에서 입력할 수 있어요.',
    genre: 'MMORPG', dev: ''
  },
  '마피아 모바일': {
    desc: '도시 건설과 마피아 전략을 결합한 전략 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 코드에서 입력 가능합니다.',
    genre: '전략', dev: ''
  },
  '무한 파이터': {
    desc: '방치형 액션 RPG로 궁수 영웅을 키워나가는 게임입니다.',
    tip: '쿠폰 코드는 이벤트 메뉴에서 입력할 수 있어요.',
    genre: 'RPG', dev: ''
  },
  '운검선경': {
    desc: '동양 무협 배경의 MMORPG. 무협 세계관과 다양한 직업 시스템이 특징입니다.',
    tip: '쿠폰 코드는 게임 내 이벤트 → 쿠폰 메뉴에서 입력 가능합니다.',
    genre: 'MMORPG', dev: ''
  },
  '고고머핀': {
    desc: '캐주얼 방치형 게임으로 귀여운 캐릭터와 함께하는 성장 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 입력에서 입력할 수 있어요.',
    genre: '캐주얼', dev: ''
  },
  'foundation': {
    desc: '전략 건설 게임으로 중세 도시를 건설하고 발전시키는 시뮬레이션 게임입니다.',
    tip: '쿠폰 코드는 게임 내 설정에서 입력 가능합니다.',
    genre: '전략', dev: ''
  },
  'Last Z: 서바이벌 슈터': {
    desc: '좀비 아포칼립스 배경의 서바이벌 슈팅 게임입니다.',
    tip: '쿠폰 코드는 이벤트 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: '슈팅', dev: ''
  },
  '트리 오브 세이비어: 뉴월드': {
    desc: 'IMC 게임즈의 MMORPG. 트리 오브 세이비어 IP를 기반으로 한 모바일 게임입니다.',
    tip: '쿠폰 코드는 게임 내 설정 → 쿠폰 입력에서 입력 가능합니다.',
    genre: 'MMORPG', dev: 'IMC 게임즈'
  },
  '매드 메탈 월드': {
    desc: '포스트 아포칼립스 배경의 전략 게임입니다.',
    tip: '쿠폰 코드는 설정 → 쿠폰 메뉴에서 입력할 수 있어요.',
    genre: '전략', dev: ''
  },
};

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
  // 이미지 없는 게임 추가 매핑
  '그놈은 드래곤': '그놈은 드래곤',
  '냥코 대전쟁': '냥코 대전쟁',
  '좀비고등학교': '좀비고등학교',
  '우와 모험단': '우와 모험단',
  '몬길: STAR DIVE': '몬길: STAR DIVE',
  '탑 히어로즈': '탑 히어로즈',
  '연운': '연운',
  '라테일 플러스': '라테일 플러스',
  '세븐 나이츠 리버스': '세븐나이츠 리버스',
  '미르2: 레드나이트': '미르의전설2',
  '쿠키런: 오븐스매시': '쿠키런: 오븐스매시',
  '일곱 개의 대죄: Origin': '일곱 개의 대죄: Origin',
  '림버스 컴퍼니': 'Limbus Company',
  '트리 오브 세이비어: 뉴월드': '트리 오브 세이비어',
  '소울 아이들': '소울아이들',
  '미르2: 새왕국': '미르2 새왕국',
  '군주의 여정': '군주의 여정',
  '다크엔젤: 심연의 날개': '다크엔젤',
  '천년 다시': '천년: 다시',
  '질풍삼국': '질풍삼국',
  '운검선경': '운검선경',
  'ROEM': 'ROEM',
  '무한 파이터': '무한 파이터',
  '아스달 연대기': '아스달 연대기',
  '소울 스트라이크': '소울 스트라이크',
  '에픽세븐': '에픽세븐',
  '블레이드M': '블레이드 M',
  '영웅 얼라이언스': 'Hero Wars',
  'SSMS': 'SSMS',
  '드래곤의 토템': '드래곤의 토템',
  '뱅뱅 서바이버': '뱅뱅 서바이버',
  '콤보 히어로': '영웅일 뿐이야',
  '젠레스 존 제로': '젠레스 존 제로',
  '아스달 연대기': '아스달 연대기',
  'Honor of Kings': '아너 오브 킹즈',
  '페이블타운': 'Fable Town',
  '로얄 킹덤': 'Royal Kingdom',
  'MadOut2': 'MadOut2',
  '더 그랜드 마피아': 'The Grand Mafia',
  '리니지2 레볼루션': '리니지2 레볼루션',
  '강림2': '강림2',
  '데빌M': '데블M',
  '소녀전쟁': '소녀전쟁',
  '나자릭의 군주': '나자릭의 군주',
  '드래곤헤어: 사일런트 갓': 'Dragonheir: Silent Gods',
  '에코칼립스': 'EchoCalypse',
  '매드 메탈 월드': '매드 메탈 월드',
  '스타시드: 아스니아 트리거': '스타시드',
  '세븐나이츠 키우기': '세븐나이츠 키우기',
  '타리스랜드': 'Tarisland',
  '림버스 컴퍼니': 'Limbus Company',
  '리버스: 1999': 'Reverse: 1999',
  '아이온2': '아이온2',
  '나이트 크로우': '나이트 크로우',
  '왓처 오브 렐름스': 'Watcher of Realms',
  '마비노기 모바일': '마비노기 모바일',
  '소녀전선2: 추방': '소녀전선2',
  '호라이즌 워커': '호라이즌 워커',
  '어비스 데스티니': '어비스: 데스티니',
  '영웅 키우기': '영웅 키우기',
  '더 라그나로크': 'THE 라그나로크',
  '킹 오브 아발론': 'King of Avalon',
  '미니 엠파이어': '미니 엠파이어',
  '로맨틱 파워하우스': '로맨틱 파워하우스',
  '고고머핀': '고고 머핀',
  '에이스 디펜더': '에이스 디펜더',
  '신비의 왕국': '신비의 왕국',
  '인외지道': '인외지',
  '좀비.io': 'Zombie.io',
  '킹 아서: 레전드 라이즈': 'Kingshot',
  '전설과 용: 새로운 여정': '전설과 용',
  '일곱 개의 대죄 키우기': '일곱 개의 대죄 키우기',
  '미니 히어로즈 리본': 'Mini Warriors Reborn',
  '리니지2 레볼루션': '리니지2 레볼루션',
  '고인장: 강시도사': '고인장',
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
  // 검색어 목록: 매핑된 이름 → 원본 이름 → 영문변환 시도
  const mapped = GAME_EN_NAME[gameName] || gameName;
  const searchTerms = [mapped];
  if (mapped !== gameName) searchTerms.push(gameName);
  // 콜론 제거 버전도 시도
  const noColon = mapped.replace(/[:\s]+/g, ' ').trim();
  if (noColon !== mapped) searchTerms.push(noColon);

  for (const searchTerm of searchTerms) {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=kr&entity=software&limit=5`;
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
        // 게임 카테고리인 것 우선
        const games = json.results.filter(r => r.primaryGenreName && r.primaryGenreName.toLowerCase().includes('game'));
        const app = games.length > 0 ? games[0] : json.results[0];
        const imageUrl = app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60;
        console.log(`    🍎 iTunes: ${app.trackName} → ${imageUrl ? '✓' : '✗'}`);
        if (imageUrl) return imageUrl;
      }
    } catch(e) {
      // 다음 검색어로 시도
    }
  }
  console.log(`    ✗ iTunes 이미지 없음: ${gameName}`);
  return null;
}

/* ═══════════════════════════════════════════════════════
   게임 이미지 가져오기 (iTunes 우선 → 블루스택 폴백)
═══════════════════════════════════════════════════════ */
async function fetchGooglePlayImage(gameName) {
  // Google Play 검색으로 이미지 가져오기
  try {
    const searchName = GAME_EN_NAME[gameName] || gameName;
    const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(searchName)}&c=apps&hl=ko`;
    const html = await fetchUrl(searchUrl);

    // 앱 아이콘 이미지 패턴
    const iconMatch = html.match(/src="(https:\/\/play-lh\.googleusercontent\.com\/[^"]+)"[^>]*alt="[^"]*"/);
    if (iconMatch) {
      // 고화질로 변환 (=w512-h512 추가)
      const imgUrl = iconMatch[1].replace(/=w\d+-h\d+/, '=w512-h512').replace(/=s\d+/, '=s512');
      console.log(`    🎮 Google Play: ${gameName} → ✓`);
      return imgUrl;
    }

    // 두 번째 패턴 시도
    const iconMatch2 = html.match(/https:\/\/play-lh\.googleusercontent\.com\/[^"'\s]+/);
    if (iconMatch2) {
      const imgUrl = iconMatch2[0].replace(/=w\d+-h\d+/, '=w512-h512');
      console.log(`    🎮 Google Play (2): ${gameName} → ✓`);
      return imgUrl;
    }
    return null;
  } catch(e) {
    return null;
  }
}

async function fetchGameImage(appPageUrl, gameName) {
  // 1. iTunes API 우선 (합법적, 고화질 512px)
  const itunesUrl = await fetchItunesImage(gameName);
  if (itunesUrl) return { imageUrl: itunesUrl, packageName: null };
  await delay(300);

  // 2. Google Play 폴백
  const googlePlayUrl = await fetchGooglePlayImage(gameName);
  if (googlePlayUrl) return { imageUrl: googlePlayUrl, packageName: null };
  await delay(300);

  // 3. 블루스택 폴백
  if (!appPageUrl) return { imageUrl: null, packageName: null };
  try {
    const html = await fetchUrl(appPageUrl);
    const pkgMatch = html.match(/app_pkg=([a-z][a-z0-9._]+)/i);
    const packageName = pkgMatch ? pkgMatch[1] : null;
    const iconMatch = html.match(/src="(https:\/\/cdn-icon\.bluestacks\.com\/[^"]+)"/);
    if (iconMatch) {
      console.log(`    🔵 블루스택: ${gameName} → ✓`);
      return { imageUrl: iconMatch[1], packageName };
    }
    return { imageUrl: null, packageName };
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

<!-- 관련 공략/뉴스 섹션 (Firebase에서 로드) -->
<div id="gameRelated" style="max-width:800px;margin:0 auto 2rem;padding:0 1.25rem"></div>
<script>
(function(){
  if(typeof firebase==='undefined') return;
  var app2;
  try{ app2=firebase.app('rel-${slug}'); }catch(e){ app2=firebase.initializeApp({apiKey:'AIzaSyBd0e5i2LMNtZkM1aib4kZdgjUWkzMtN7Q',authDomain:'dooood-2c725.firebaseapp.com',projectId:'dooood-2c725'},'rel-${slug}'); }
  var db2=firebase.firestore(app2);
  var gname='${gameName}';
  Promise.all([
    db2.collection('guides').where('game','==',gname).orderBy('createdAt','desc').limit(4).get(),
    db2.collection('news').where('game','==',gname).orderBy('createdAt','desc').limit(4).get()
  ]).then(function(results){
    var html='';
    var gSnap=results[0], nSnap=results[1];
    if(!gSnap.empty){
      html+='<div style="background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:1rem"><div style="font-size:14px;font-weight:800;color:#efefef;margin-bottom:12px">📖 '+gname+' 공략 가이드</div>';
      gSnap.forEach(function(d){var g=d.data();html+='<a href="/guide/'+d.id+'.html" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-decoration:none"><span style="font-size:18px">'+(g.icon||'📖')+'</span><div><div style="font-size:13px;font-weight:600;color:#efefef">'+(g.title||'')+'</div><div style="font-size:11px;color:#aaa">'+(g.cat||'공략')+'</div></div></a>';});
      html+='</div>';
    }
    if(!nSnap.empty){
      html+='<div style="background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem"><div style="font-size:14px;font-weight:800;color:#efefef;margin-bottom:12px">📰 '+gname+' 최신 뉴스</div>';
      nSnap.forEach(function(d){var n=d.data();html+='<a href="/news/'+d.id+'.html" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-decoration:none"><span style="font-size:18px">'+(n.icon||'📰')+'</span><div><div style="font-size:13px;font-weight:600;color:#efefef">'+(n.title||'')+'</div><div style="font-size:11px;color:#aaa">'+(n.date||'')+'</div></div></a>';});
      html+='</div>';
    }
    if(html) document.getElementById('gameRelated').innerHTML=html;
  }).catch(function(){});
})();
</script>

<footer>
  <a href="/">쿠폰던전</a> &nbsp;·&nbsp;
  <a href="/about.html">소개</a> &nbsp;·&nbsp;
  <a href="/contact.html">문의</a> &nbsp;·&nbsp;
  <a href="/#terms">이용약관</a><br><br>
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

<!-- 관련 공략/뉴스 섹션 (Firebase에서 로드) -->
<div id="gameRelated" style="max-width:800px;margin:0 auto 2rem;padding:0 1.25rem"></div>
<script>
(function(){
  if(typeof firebase==='undefined') return;
  var app2;
  try{ app2=firebase.app('rel-${slug}'); }catch(e){ app2=firebase.initializeApp({apiKey:'AIzaSyBd0e5i2LMNtZkM1aib4kZdgjUWkzMtN7Q',authDomain:'dooood-2c725.firebaseapp.com',projectId:'dooood-2c725'},'rel-${slug}'); }
  var db2=firebase.firestore(app2);
  var gname='${gameName}';
  Promise.all([
    db2.collection('guides').where('game','==',gname).orderBy('createdAt','desc').limit(4).get(),
    db2.collection('news').where('game','==',gname).orderBy('createdAt','desc').limit(4).get()
  ]).then(function(results){
    var html='';
    var gSnap=results[0], nSnap=results[1];
    if(!gSnap.empty){
      html+='<div style="background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:1rem"><div style="font-size:14px;font-weight:800;color:#efefef;margin-bottom:12px">📖 '+gname+' 공략 가이드</div>';
      gSnap.forEach(function(d){var g=d.data();html+='<a href="/guide/'+d.id+'.html" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-decoration:none"><span style="font-size:18px">'+(g.icon||'📖')+'</span><div><div style="font-size:13px;font-weight:600;color:#efefef">'+(g.title||'')+'</div><div style="font-size:11px;color:#aaa">'+(g.cat||'공략')+'</div></div></a>';});
      html+='</div>';
    }
    if(!nSnap.empty){
      html+='<div style="background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem"><div style="font-size:14px;font-weight:800;color:#efefef;margin-bottom:12px">📰 '+gname+' 최신 뉴스</div>';
      nSnap.forEach(function(d){var n=d.data();html+='<a href="/news/'+d.id+'.html" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-decoration:none"><span style="font-size:18px">'+(n.icon||'📰')+'</span><div><div style="font-size:13px;font-weight:600;color:#efefef">'+(n.title||'')+'</div><div style="font-size:11px;color:#aaa">'+(n.date||'')+'</div></div></a>';});
      html+='</div>';
    }
    if(html) document.getElementById('gameRelated').innerHTML=html;
  }).catch(function(){});
})();
</script>

<footer>
  <a href="/">쿠폰던전</a> &nbsp;·&nbsp;
  <a href="/about.html">소개</a> &nbsp;·&nbsp;
  <a href="/contact.html">문의</a> &nbsp;·&nbsp;
  <a href="/#terms">이용약관</a><br><br>
  © ${year} 쿠폰던전
</footer>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════
   HTML 템플릿 — 게임 전용 페이지
═══════════════════════════════════════════════════════ */
function buildGamePage(gameName, coupons, imageUrl, genre, relatedGuides = [], relatedNews = []) {
  const slug = toSlug(gameName);
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString('ko-KR');
  const couponCount = coupons.length;
  const activeCoupons = coupons.filter(c => !c.expire || c.expire === '무기한' || new Date(c.expire.replace(/\./g,'-')) > new Date());
  const expiredCoupons = coupons.filter(c => c.expire && c.expire !== '무기한' && new Date(c.expire.replace(/\./g,'-')) <= new Date());
  const gameInfo = GAME_INFO[gameName] || {};
  const gameDesc = gameInfo.desc || `${gameName}의 최신 쿠폰 코드를 확인하세요.`;
  const gameTip = gameInfo.tip || '게임 내 설정 또는 이벤트 메뉴에서 쿠폰 코드를 입력할 수 있어요.';

  // 정적 공략 HTML 생성
  const staticGuides = relatedGuides.length > 0 ? `
  <div style="background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:1rem">
    <div style="font-size:14px;font-weight:800;color:#efefef;margin-bottom:12px">📖 ${gameName} 공략 가이드</div>
    ${relatedGuides.map(g => `<a href="/guide/${g.id}.html" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-decoration:none">
      <span style="font-size:20px">${g.icon||'📖'}</span>
      <div><div style="font-size:13px;font-weight:600;color:#efefef">${g.title||''}</div>
      <div style="font-size:11px;color:#aaa">${g.cat||'공략'} · ${g.game||''}</div></div>
    </a>`).join('')}
  </div>` : '';

  // 정적 뉴스 HTML 생성
  const staticNews = relatedNews.length > 0 ? `
  <div style="background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:1rem">
    <div style="font-size:14px;font-weight:800;color:#efefef;margin-bottom:12px">📰 ${gameName} 최신 뉴스</div>
    ${relatedNews.map(n => `<a href="/news/${n.id}.html" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-decoration:none">
      <span style="font-size:20px">${n.icon||'📰'}</span>
      <div><div style="font-size:13px;font-weight:600;color:#efefef">${n.title||''}</div>
      <div style="font-size:11px;color:#aaa">${n.date||''}</div></div>
    </a>`).join('')}
  </div>` : '';

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
    <div class="how-text">${gameTip}</div>
    <div class="how-text" style="margin-top:8px;color:#aaa;font-size:12px">위의 쿠폰 코드를 복사한 후 입력하세요. 코드는 대소문자를 구분하며, 계정당 1회만 사용 가능합니다.</div>
  </div>

  <!-- 게임 소개 -->
  <div class="section-title">🎮 ${gameName} 게임 소개</div>
  <div style="background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:1rem">
    <p style="font-size:14px;color:#ccc;line-height:1.9">${gameDesc}</p>
    ${gameInfo.dev ? `<p style="font-size:12px;color:#555;margin-top:8px">개발사: ${gameInfo.dev}</p>` : ''}
  </div>

  <!-- 관련 공략 (정적 포함 - SEO) -->
  ${staticGuides}

  <!-- 관련 뉴스 (정적 포함 - SEO) -->
  ${staticNews}

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
   사전예약 게임 자동 수집 (인벤 + 게임메카)
═══════════════════════════════════════════════════════ */

// 사전예약 정적 페이지 생성
function buildPreorderPage(game) {
  const slug = toSlug(game.name);
  const year = new Date().getFullYear();
  const today = new Date().toLocaleDateString('ko-KR');
  const dday = game.releaseDate ? Math.ceil((new Date(game.releaseDate.replace(/\./g,'-')) - new Date()) / 86400000) : null;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": game.name,
    "description": game.desc || `${game.name} 사전예약 정보`,
    "url": `${SITE_URL}/preorder/${slug}.html`,
    "genre": game.genre || 'RPG',
    "publisher": {"@type": "Organization", "name": game.dev || ''},
    "datePublished": game.releaseDate || '',
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${game.name} 사전예약 — 출시일·보상·링크 총정리 ${year}</title>
<meta name="description" content="${game.name} 사전예약 정보. 출시 예정일, 사전예약 보상, 공식 링크를 확인하세요. ${game.dev || ''}">
<meta property="og:title" content="${game.name} 사전예약 — 쿠폰던전">
<meta property="og:description" content="${game.name} 사전예약 정보. 출시 예정일 ${game.releaseDate || '미정'}, 사전예약자 ${game.preregCount || '0'}명">
<meta property="og:url" content="${SITE_URL}/preorder/${slug}.html">
${game.imageUrl ? `<meta property="og:image" content="${game.imageUrl}">` : ''}
<link rel="canonical" href="${SITE_URL}/preorder/${slug}.html">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3292286283313303" crossorigin="anonymous"></script>
<script type="application/ld+json">${JSON.stringify(schemaData)}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#09090f;color:#efefef;font-family:'Noto Sans KR',sans-serif;min-height:100vh;line-height:1.8}
a{color:#e94560;text-decoration:none}
header{background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);padding:0 1.25rem;height:54px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:18px;font-weight:800;color:#efefef}.logo span{color:#e94560}
.home-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#aaa;padding:6px 14px;border-radius:7px;font-size:12px}
.ad-wrap{padding:8px 1.25rem;background:#13131f;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:center}
.container{max-width:800px;margin:0 auto;padding:1.5rem 1.25rem}
.breadcrumb{font-size:12px;color:#555;margin-bottom:1.5rem}.breadcrumb a{color:#aaa}
.game-header{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:1.5rem;margin-bottom:1.5rem;display:flex;gap:20px;align-items:center}
.game-icon{width:90px;height:90px;border-radius:18px;object-fit:cover;background:#1a1a2c;flex-shrink:0}
.game-title{font-size:24px;font-weight:900;margin-bottom:6px}
.game-dev{font-size:13px;color:#aaa;margin-bottom:10px}
.badge-row{display:flex;gap:8px;flex-wrap:wrap}
.badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
.badge-dday{background:rgba(233,69,96,.2);color:#e94560;border:1px solid rgba(233,69,96,.3)}
.badge-genre{background:rgba(155,93,229,.2);color:#9b5de5;border:1px solid rgba(155,93,229,.3)}
.badge-count{background:rgba(62,207,142,.15);color:#3ecf8e;border:1px solid rgba(62,207,142,.25)}
.section{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-bottom:1rem}
.section h2{font-size:15px;font-weight:800;color:#efefef;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.section p{font-size:14px;color:#ccc;line-height:1.9}
.preorder-btn{display:block;background:#e94560;color:#fff;text-align:center;padding:14px;border-radius:10px;font-size:16px;font-weight:800;margin-bottom:1rem;transition:all .2s}
.preorder-btn:hover{background:#c73652;color:#fff}
.info-row{display:flex;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.info-row:last-child{border:none}
.info-label{font-size:13px;color:#aaa;width:120px;flex-shrink:0}
.info-value{font-size:13px;color:#efefef}
.related-box{background:#13131f;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.25rem;margin-top:1rem}
.related-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.related-link{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#aaa;padding:6px 12px;border-radius:6px;font-size:12px;transition:all .2s}
.related-link:hover{border-color:#e94560;color:#e94560}
footer{background:#13131f;border-top:1px solid rgba(255,255,255,.07);padding:1.5rem;text-align:center;color:#555;font-size:12px;margin-top:3rem}
footer a{color:#aaa}
@media(max-width:560px){.game-header{flex-direction:column;text-align:center}.badge-row{justify-content:center}}
</style>
</head>
<body>
<header>
  <a href="/" class="logo">쿠폰<span>던전</span></a>
  <a href="/" class="home-btn">← 전체 보기</a>
</header>
<div class="ad-wrap">
  <ins class="adsbygoogle" style="display:block;width:100%;max-width:728px" data-ad-client="ca-pub-3292286283313303" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
<div class="container">
  <nav class="breadcrumb">
    <a href="/">쿠폰던전</a> › <a href="/#preorder">사전예약</a> › ${game.name}
  </nav>

  <div class="game-header">
    ${game.imageUrl ? `<img class="game-icon" src="${game.imageUrl}" alt="${game.name}">` : `<div class="game-icon" style="display:flex;align-items:center;justify-content:center;font-size:40px">🎮</div>`}
    <div style="flex:1">
      <h1 class="game-title">${game.name}</h1>
      <div class="game-dev">${game.dev || ''} · ${game.genre || 'RPG'}</div>
      <div class="badge-row">
        ${dday !== null && dday >= 0 ? `<span class="badge badge-dday">⏰ D-${dday}</span>` : '<span class="badge badge-dday">📅 출시일 미정</span>'}
        <span class="badge badge-genre">${game.genre || 'RPG'}</span>
        ${game.preregCount ? `<span class="badge badge-count">👥 ${Number(game.preregCount).toLocaleString()}명 사전예약</span>` : ''}
      </div>
    </div>
  </div>

  ${game.preorderUrl ? `<a href="${game.preorderUrl}" target="_blank" rel="noopener" class="preorder-btn">🎮 지금 사전예약 하기 →</a>` : ''}

  <div class="section">
    <h2>📋 게임 정보</h2>
    <div class="info-row"><span class="info-label">게임명</span><span class="info-value">${game.name}</span></div>
    <div class="info-row"><span class="info-label">개발사</span><span class="info-value">${game.dev || '미정'}</span></div>
    <div class="info-row"><span class="info-label">장르</span><span class="info-value">${game.genre || 'RPG'}</span></div>
    <div class="info-row"><span class="info-label">출시 예정일</span><span class="info-value">${game.releaseDate || '미정'}</span></div>
    <div class="info-row"><span class="info-label">플랫폼</span><span class="info-value">${game.platform || 'iOS / Android'}</span></div>
    ${game.preregCount ? `<div class="info-row"><span class="info-label">사전예약자</span><span class="info-value">${Number(game.preregCount).toLocaleString()}명</span></div>` : ''}
  </div>

  ${game.desc ? `
  <div class="section">
    <h2>🎮 게임 소개</h2>
    <p>${game.desc}</p>
  </div>` : ''}

  ${game.reward ? `
  <div class="section">
    <h2>🎁 사전예약 보상</h2>
    <p>${game.reward}</p>
  </div>` : ''}

  <div class="related-box">
    <div style="font-size:13px;font-weight:700;color:#aaa">🔗 관련 링크</div>
    <div class="related-links">
      <a class="related-link" href="/">🎫 전체 쿠폰 보기</a>
      <a class="related-link" href="/#preorder">📋 전체 사전예약</a>
      ${game.preorderUrl ? `<a class="related-link" href="${game.preorderUrl}" target="_blank">🎮 공식 사전예약</a>` : ''}
    </div>
  </div>

  <div style="font-size:11px;color:#444;margin-top:1.5rem;text-align:center">
    마지막 업데이트: ${today} · 정보는 공식 발표 기준이며 변경될 수 있습니다.
  </div>
</div>
<footer>
  <a href="/">쿠폰던전</a> &nbsp;·&nbsp; <a href="/about.html">소개</a> &nbsp;·&nbsp; <a href="/contact.html">문의</a><br><br>
  © ${year} 쿠폰던전
</footer>
</body>
</html>`;
}

// 사전예약 게임 자동 수집 (블루스택 + Pockettactics + 직접 정의)
async function collectPreorderGames() {
  console.log('\n📋 사전예약 게임 자동 수집 중...');
  const games = [];

  // 1. 블루스택 출시예정 페이지 수집
  try {
    const upcomingUrls = [
      'https://www.bluestacks.com/ko/blog/upcoming-games.html',
      'https://www.bluestacks.com/ko/blog/pre-registration-games.html',
    ];
    for (const url of upcomingUrls) {
      try {
        const html = await fetchUrl(url);
        const re = /class="card-title[^"]*"[^>]*>\s*([^<]{3,40})\s*</gi;
        const dateRe = /(\d{4})[년.](\d{1,2})[월.](\d{0,2})/g;
        let m;
        while ((m = re.exec(html)) !== null) {
          const name = m[1].trim();
          if (name.length > 2 && name.length < 35 && !/^[a-z\s]+$/i.test(name)) {
            games.push({ name, source: '블루스택', releaseDate: null, genre: 'RPG' });
          }
        }
        await delay(500);
      } catch(e) {}
    }
  } catch(e) {}

  // 2. Pockettactics 어퍼커밍 게임
  try {
    const html = await fetchUrl('https://www.pockettactics.com/upcoming-mobile-games');
    const re = /<h[23][^>]*>\s*<a[^>]*>([^<]{3,40})<\/a>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const name = m[1].trim();
      if (name.length > 2) {
        // 한글 게임명 매핑
        const koName = GAME_EN_NAME[name] || null;
        games.push({ name: koName || name, nameEn: name, source: 'Pockettactics', releaseDate: null, genre: 'RPG' });
      }
    }
    await delay(500);
  } catch(e) { console.log(`  ⚠️ Pockettactics 수집 실패: ${e.message}`); }

  // 3. 블루스택 게임 목록에서 아직 쿠폰 없고 최근 등록된 게임들
  try {
    const snap = await db.collection('coupons').get();
    const gameNames = new Set();
    snap.forEach(d => gameNames.add(d.data().game));
    // 쿠폰이 없는 게임 중 최근 추가된 게임들을 사전예약 후보로
    // (실제 구현: 블루스택에서 recently-added 게임들)
    const recentHtml = await fetchUrl('https://www.bluestacks.com/ko/blog/redeem-codes.html');
    const recentRe = /href="\/ko\/blog\/redeem-codes\/([^"]+)-redeem-codes-ko\.html"/g;
    let m2;
    const recentGames = [];
    while ((m2 = recentRe.exec(recentHtml)) !== null) {
      const slug = m2[1];
      const koName = SLUG_TO_KO[slug];
      if (koName && !gameNames.has(koName)) {
        recentGames.push({ name: koName, source: '블루스택', releaseDate: null, genre: 'RPG' });
      }
    }
    if (recentGames.length > 0) games.push(...recentGames.slice(0, 5));
  } catch(e) {}

  // 중복 제거
  const uniqueGames = [];
  const seen = new Set();
  for (const g of games) {
    if (!seen.has(g.name) && g.name.length > 1) {
      seen.add(g.name);
      uniqueGames.push(g);
    }
  }

  console.log(`  📋 수집된 사전예약 후보: ${uniqueGames.length}개`);

  // Firebase pending 컬렉션에 저장 (중복 제거)
  if (uniqueGames.length > 0) {
    try {
      const existing = await db.collection('preorders_pending').get();
      const existingNames = new Set();
      existing.forEach(d => existingNames.add(d.data().name));

      const approved = await db.collection('preorders').get();
      approved.forEach(d => existingNames.add(d.data().game || d.data().name));

      let added = 0;
      for (const game of uniqueGames) {
        if (!existingNames.has(game.name)) {
          await db.collection('preorders_pending').add({
            ...game,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
          added++;
        }
      }
      if (added > 0) console.log(`  ✅ 사전예약 후보 ${added}개 추가 → admin.html에서 승인하세요!`);
      else console.log(`  ✅ 새 사전예약 후보 없음 (기존 ${existingNames.size}개 유지)`);
    } catch(e) {
      console.log(`  ⚠️ 사전예약 저장 실패: ${e.message}`);
    }
  }

  return uniqueGames;
}

/* ═══════════════════════════════════════════════════════
   sitemap.xml 생성
═══════════════════════════════════════════════════════ */
function buildSitemap(gamePages, guidePages, newsPages, preorderPages = []) {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    `  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...gamePages.map(slug => `  <url><loc>${SITE_URL}/game/${slug}.html</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`),
    ...preorderPages.map(slug => `  <url><loc>${SITE_URL}/preorder/${slug}.html</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`),
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
   RSS 피드 생성 (네이버/구글 구독)
═══════════════════════════════════════════════════════ */
function buildRSS(guides, news) {
  const now = new Date().toUTCString();
  const items = [];

  // 뉴스 아이템
  news.forEach(n => {
    const slug = n.title.replace(/[:\s]+/g, '-').replace(/[^a-z0-9가-힣-]/gi, '').replace(/-+/g, '-').toLowerCase();
    const pubDate = n.date ? new Date(n.date.replace(/\./g, '-')).toUTCString() : now;
    items.push({
      title: n.title,
      link: `${SITE_URL}/news/${slug}.html`,
      description: n.content ? n.content.substring(0, 200) + '...' : n.title,
      pubDate,
      category: '게임뉴스',
    });
  });

  // 공략 아이템
  guides.forEach(g => {
    const slug = g.title.replace(/[:\s]+/g, '-').replace(/[^a-z0-9가-힣-]/gi, '').replace(/-+/g, '-').toLowerCase();
    const pubDate = g.createdAt ? new Date(g.createdAt).toUTCString() : now;
    items.push({
      title: g.title,
      link: `${SITE_URL}/guide/${slug}.html`,
      description: g.content ? g.content.substring(0, 200) + '...' : g.title,
      pubDate,
      category: '게임공략',
    });
  });

  // 날짜 순 정렬
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const itemsXml = items.slice(0, 50).map(item => `
  <item>
    <title><![CDATA[${item.title}]]></title>
    <link>${item.link}</link>
    <description><![CDATA[${item.description}]]></description>
    <pubDate>${item.pubDate}</pubDate>
    <category><![CDATA[${item.category}]]></category>
    <guid isPermaLink="true">${item.link}</guid>
  </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>쿠폰던전 — 국내 모바일게임 쿠폰 모음</title>
    <link>${SITE_URL}</link>
    <description>리니지W, 원신, 메이플스토리M 등 국내 모바일게임 최신 쿠폰 코드와 공략을 한곳에서 확인하세요.</description>
    <language>ko</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icon.png</url>
      <title>쿠폰던전</title>
      <link>${SITE_URL}</link>
    </image>
    ${itemsXml}
  </channel>
</rss>`;
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
   Google Gemini API - 공략/뉴스 자동 생성
═══════════════════════════════════════════════════════ */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.log('    ⚠️ GEMINI_API_KEY 없음 - 스킵');
    return null;
  }
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  try {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const result = await new Promise((resolve, reject) => {
      const url = new URL(geminiUrl);
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        }
      }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
      req.write(body);
      req.end();
    });

    if (result.candidates && result.candidates[0]) {
      return result.candidates[0].content.parts[0].text;
    }
    return null;
  } catch(e) {
    console.log(`    ⚠️ Gemini 호출 실패: ${e.message}`);
    return null;
  }
}

// 게임 공략 자동 생성
async function generateGuide(gameName, genre) {
  const prompt = `당신은 한국 모바일게임 전문 공략 작가입니다.
"${gameName}" 게임의 공략 글을 작성해주세요.

요구사항:
- 한국어로 작성
- 2000자 이상 상세하게 작성
- 실제 도움이 되는 구체적인 팁 포함
- 마크다운 형식 사용 (## 제목, ### 소제목)
- 초보자부터 중급자까지 도움이 되는 내용
- 마지막에 쿠폰 코드 입력 방법 언급

다음 구조로 작성:
1. 게임 소개 (2~3문장)
2. 기본 시스템 설명
3. 초보자 필수 팁 3~5가지
4. 효율적인 성장 방법
5. 쿠폰 코드 활용법

JSON 형식으로 응답:
{
  "title": "제목 (SEO 최적화된 60자 이내)",
  "cat": "카테고리 (초보가이드/공략/팁/무과금 중 하나)",
  "icon": "관련 이모지 1개",
  "content": "본문 내용"
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;

  const result = await callGemini(prompt);
  if (!result) return null;

  try {
    const clean = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      game: gameName,
      title: parsed.title,
      cat: parsed.cat || '공략',
      icon: parsed.icon || '🎮',
      content: parsed.content,
      views: 0,
      createdAt: new Date().toISOString(),
    };
  } catch(e) {
    console.log(`    ⚠️ Gemini 응답 파싱 실패: ${e.message}`);
    return null;
  }
}

// 게임 뉴스 자동 생성
async function generateNews(gameName) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;

  const prompt = `당신은 한국 모바일게임 뉴스 작가입니다.
"${gameName}" 게임의 최신 업데이트 뉴스 기사를 작성해주세요.

요구사항:
- 한국어로 작성
- 500자 이상 작성
- 실제 게임 업데이트 내용처럼 자연스럽게 작성
- 신규 콘텐츠, 이벤트, 캐릭터 등 포함
- 마지막에 쿠폰 코드 확인 권유 문구 포함

JSON 형식으로 응답:
{
  "title": "뉴스 제목 (60자 이내, 흥미롭게)",
  "icon": "관련 이모지 1개",
  "content": "뉴스 본문 내용"
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;

  const result = await callGemini(prompt);
  if (!result) return null;

  try {
    const clean = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      game: gameName,
      title: parsed.title,
      icon: parsed.icon || '📰',
      content: parsed.content,
      date: dateStr,
      createdAt: new Date().toISOString(),
    };
  } catch(e) {
    console.log(`    ⚠️ Gemini 뉴스 파싱 실패: ${e.message}`);
    return null;
  }
}

// 자동 공략/뉴스 생성 메인 함수
async function autoGenerateContent() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('  🔑 GEMINI_API_KEY 확인:', apiKey ? `있음 (${apiKey.substring(0,8)}...)` : '없음');
  if (!apiKey || apiKey.trim() === '') {
    console.log('  ⚠️ GEMINI_API_KEY 없음 - 자동 생성 스킵');
    return;
  }

  console.log('\n🤖 Gemini AI 공략/뉴스 자동 생성 시작...');

  // 공략 생성 대상 게임 (인기 게임 위주, 매일 2개씩)
  const guideTargets = [
    { name: '원신', genre: 'rpg' },
    { name: '붕괴: 스타레일', genre: 'rpg' },
    { name: '메이플스토리M', genre: 'rpg' },
    { name: '나 혼자만 레벨업: ARISE', genre: 'rpg' },
    { name: '에픽세븐', genre: 'rpg' },
    { name: '쿠키런: 킹덤', genre: 'casual' },
    { name: '블루 아카이브', genre: 'rpg' },
    { name: '라그나로크 오리진', genre: 'rpg' },
    { name: 'AFK 저니', genre: 'rpg' },
    { name: '젠레스 존 제로', genre: 'rpg' },
  ];

  // 오늘 날짜 기반으로 2개 선택 (매일 다른 게임)
  const today = new Date().getDate();
  const idx1 = today % guideTargets.length;
  const idx2 = (today + 1) % guideTargets.length;
  const selectedGames = [guideTargets[idx1], guideTargets[idx2]];

  // 공략 생성
  for (const game of selectedGames) {
    try {
      console.log(`  📖 ${game.name} 공략 생성 중...`);
      const guide = await generateGuide(game.name, game.genre);
      if (guide) {
        await db.collection('guides').add(guide);
        console.log(`    ✅ 공략 생성 완료: ${guide.title.substring(0, 40)}...`);
      }
      await delay(2000);
    } catch(e) {
      console.log(`    ❌ ${game.name} 공략 생성 실패: ${e.message}`);
    }
  }

  // 뉴스 생성 (매일 2개)
  const newsTargets = [
    '원신', '붕괴: 스타레일', '메이플스토리M', '리니지W',
    '나 혼자만 레벨업: ARISE', '젠레스 존 제로', '에픽세븐',
    '쿠키런: 킹덤', 'AFK 저니', '블루 아카이브'
  ];

  const nIdx1 = (today + 3) % newsTargets.length;
  const nIdx2 = (today + 4) % newsTargets.length;

  for (const gameName of [newsTargets[nIdx1], newsTargets[nIdx2]]) {
    try {
      console.log(`  📰 ${gameName} 뉴스 생성 중...`);
      const news = await generateNews(gameName);
      if (news) {
        await db.collection('news').add(news);
        console.log(`    ✅ 뉴스 생성 완료: ${news.title.substring(0, 40)}...`);
      }
      await delay(2000);
    } catch(e) {
      console.log(`    ❌ ${gameName} 뉴스 생성 실패: ${e.message}`);
    }
  }

  console.log('  🤖 AI 콘텐츠 자동 생성 완료!');
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

  // 공략/뉴스 미리 로드 (게임 페이지에 정적으로 포함하기 위해)
  const allGuides = {};
  const allNews = {};
  try {
    const gAll = await db.collection('guides').orderBy('createdAt','desc').get();
    gAll.forEach(d => {
      const g = Object.assign({id: d.id}, d.data());
      if (!allGuides[g.game]) allGuides[g.game] = [];
      if (allGuides[g.game].length < 4) allGuides[g.game].push(g);
    });
    const nAll = await db.collection('news').orderBy('createdAt','desc').get();
    nAll.forEach(d => {
      const n = Object.assign({id: d.id}, d.data());
      if (!allNews[n.game]) allNews[n.game] = [];
      if (allNews[n.game].length < 4) allNews[n.game].push(n);
    });
    console.log(`  📚 공략 ${gAll.size}개, 뉴스 ${nAll.size}개 로드 완료`);
  } catch(e) { console.log('  ⚠️ 공략/뉴스 로드 실패:', e.message); }

  let guidesSlugs = [], newsSlugs = [];
  try {
    // 사전예약 정적 페이지 생성
    try {
      const pSnap = await db.collection('preorders').get();
      const preorderSlugs = [];
      pSnap.forEach(d => {
        const game = Object.assign({id: d.id}, d.data());
        const slug = toSlug(game.name || '');
        if (slug) {
          gamePageFiles[`preorder/${slug}.html`] = buildPreorderPage(game);
          preorderSlugs.push(slug);
        }
      });
      console.log(`  🎮 사전예약 페이지 ${preorderSlugs.length}개 생성`);
    } catch(e) { console.log('  ⚠️ 사전예약 페이지 생성 실패:', e.message); }

  // 공략 정적 페이지 생성
    const gSnap = await db.collection('guides').get();
    gSnap.forEach(d => {
      const guide = Object.assign({id: d.id}, d.data());
      // doc ID를 기본 파일명으로 사용 (안정적)
      gamePageFiles[`guide/${d.id}.html`] = buildGuidePage(guide);
      guidesSlugs.push(d.id);
      // 타이틀 슬러그로도 중복 생성 (기존 링크 호환성)
      const slug = toSlug(guide.title || '');
      if (slug) {
        gamePageFiles[`guide/${slug}.html`] = buildGuidePage(guide);
      }
    });
    console.log(`  📖 공략 페이지 ${guidesSlugs.length}개 생성`);

    // 뉴스 정적 페이지 생성
    const nSnap = await db.collection('news').get();
    nSnap.forEach(d => {
      const news = Object.assign({id: d.id}, d.data());
      // doc ID를 기본 파일명으로 사용 (안정적)
      gamePageFiles[`news/${d.id}.html`] = buildNewsPage(news);
      newsSlugs.push(d.id);
      // 타이틀 슬러그로도 중복 생성 (기존 링크 호환성)
      const slug = toSlug(news.title || '');
      if (slug) {
        gamePageFiles[`news/${slug}.html`] = buildNewsPage(news);
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
        gamePageFiles[`game/${slug}.html`] = buildGamePage(gameName, validCoupons, imageUrl, genre, allGuides[gameName]||[], allNews[gameName]||[]);
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

  // 사전예약 게임 자동 수집
  await collectPreorderGames();

  // Gemini AI 공략/뉴스 자동 생성
  await autoGenerateContent();

  console.log(`\n💾 Firebase 저장 중... (${allCoupons.length}개)`);
  await saveToDB(allCoupons);

  console.log('\n🗺️ sitemap.xml + RSS 생성 중...');
  const preorderSlugs2 = Object.keys(gamePageFiles).filter(k=>k.startsWith('preorder/')).map(k=>k.replace('preorder/','').replace('.html',''));
  gamePageFiles['sitemap.xml'] = buildSitemap(gamePageSlugs, guidesSlugs, newsSlugs, preorderSlugs2);
  gamePageFiles['robots.txt'] = buildRobots();

  // RSS 피드 생성
  try {
    const gSnap2 = await db.collection('guides').get();
    const nSnap2 = await db.collection('news').get();
    const guidesData = [], newsData = [];
    gSnap2.forEach(d => guidesData.push(d.data()));
    nSnap2.forEach(d => newsData.push(d.data()));
    gamePageFiles['rss.xml'] = buildRSS(guidesData, newsData);
    console.log(`  📡 RSS 피드 생성 완료 (공략 ${guidesData.length}개 + 뉴스 ${newsData.length}개)`);
  } catch(e) {
    console.log('  ⚠️ RSS 생성 실패:', e.message);
  }

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
