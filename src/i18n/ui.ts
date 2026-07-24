/* 双语字典与路由助手。中文在根路径，英文镜像在 /en/ 前缀下，页面一一对应。 */
export type Lang = 'zh' | 'en';

export function prefix(lang: Lang): string {
  return lang === 'en' ? '/en' : '';
}

/** 给站内路径加语言前缀：href('en', '/photos/') → '/en/photos/' */
export function href(lang: Lang, path: string): string {
  return prefix(lang) + path;
}

/** 当前路径在另一种语言里的镜像地址（所有使用 Base 的页面都有双语镜像） */
export function switchPath(lang: Lang, pathname: string): string {
  if (lang === 'zh') return pathname === '/' ? '/en/' : '/en' + pathname;
  const stripped = pathname.replace(/^\/en/, '');
  return stripped === '' ? '/' : stripped;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 日期格式：zh 2024.01.20 / en Jan 20, 2024 */
export function fmtDate(lang: Lang, d: Date | string): string {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = date.getMonth();
  const day = date.getDate();
  if (lang === 'en') return `${MONTHS_EN[m]} ${day}, ${y}`;
  return `${y}.${String(m + 1).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
}

export const ui = {
  zh: {
    'site.name': '思想名片',
    'site.desc': '严树成的个人网站。写作、项目、照片、随记。',
    'a11y.skip': '跳到内容',
    'a11y.home': '首页',
    'a11y.menu': '全站菜单',
    'nav.projects': '项目',
    'nav.writing': '写作',
    'nav.notes': '随记',
    'nav.photos': '照片',
    'nav.vlog': '影像',
    'foot.about': '关于',
    'foot.contact': '联系',
    'foot.top': '返回顶部',
    'foot.news': '订阅更新。有新项目或文章时，我会写邮件告诉你。',
    'foot.subscribe': '邮件订阅',
    'foot.copy': '© {year} 严树成',
    'mail.subject': '订阅思想名片更新',
    'toast.mail': '已复制邮箱 {mail}，来信即可订阅',
    'lang.switch': 'EN',
    'lang.switchAria': 'Switch to English',
    'home.heroTitle': '终身学习，认真创造，自由表达。',
    'home.heroSub': '君子豹变，其文蔚也。',
    'about.title1': '终身学习，认真创造，',
    'about.title2': '自由表达。',
    'about.intro1': '我是严树成，现居南京，在华为做零售产品管理。',
    'about.intro2': 'INFJ。喜欢研究提高效率的自动化工具，也喜欢创造美和优雅的产品。',
    'about.secPath': '经历',
    'about.secSite': '这个站',
    'about.siteText': '这个站叫思想名片。我想让它是一张对外敞开的数字卡片——纯白、衬线字、大留白、慢动效。不放太多东西，只放我真正想表达的东西。',
    'about.secContact': '联系',
    'notes.title': '随记',
    'notes.empty': '还没有内容，但会有的。',
    'notes.notice': '',
    'writing.title': '写作',
    'writing.notice': '',
    'writing.badge': '',
    'photos.title': '照片',
    'photos.back': '← 照片墙',
    'photos.first': '已是第一张',
    'photos.last': '已是最后一张',
    'photos.prevnext': '上一张 / 下一张',
    'projects.title': '项目',
    'vlog.title': '影像',
    'life.title': '生活记录',
    'notfound.title': '页面不存在',
    'notfound.sub': '你要找的页面搬走了，或者从未存在过。',
    'notfound.back': '回到首页',
    'video.unsupported': '您的浏览器不支持视频播放。',
  },
  en: {
    'site.name': 'Sacharn',
    'site.desc': 'The personal site of Shucheng Yan — writing, projects, photos, and notes.',
    'a11y.skip': 'Skip to content',
    'a11y.home': 'Home',
    'a11y.menu': 'Site menu',
    'nav.projects': 'Projects',
    'nav.writing': 'Writing',
    'nav.notes': 'Notes',
    'nav.photos': 'Photos',
    'nav.vlog': 'Vlog',
    'foot.about': 'About',
    'foot.contact': 'Contact',
    'foot.top': 'Back to top',
    'foot.news': 'Subscribe. When there is a new project or essay, I will write you an email.',
    'foot.subscribe': 'Subscribe by email',
    'foot.copy': '© {year} Shucheng Yan',
    'mail.subject': 'Subscribe to Sacharn',
    'toast.mail': 'Copied {mail} — write to subscribe',
    'lang.switch': '中文',
    'lang.switchAria': '切换到中文',
    'home.heroTitle': 'Learn always. Create with care. Express freely.',
    'home.heroSub': 'The leopard transforms; his coat grows splendid.',
    'about.title1': 'Learn always, create with care,',
    'about.title2': 'express freely.',
    'about.intro1': "I'm Shucheng Yan, based in Nanjing, working on retail product management at Huawei.",
    'about.intro2': 'INFJ. I enjoy exploring automation tools that make life more efficient, and creating products that are beautiful and elegant.',
    'about.secPath': 'Path',
    'about.secSite': 'This Site',
    'about.siteText': 'This site is my "thought card" (思想名片) — an open digital card: pure white, serif type, generous whitespace, slow motion. Not much on it, only what I truly want to say.',
    'about.secContact': 'Contact',
    'notes.title': 'Notes',
    'notes.empty': 'Nothing here yet — but there will be.',
    'notes.notice': 'These notes were written in Chinese. The original text is kept for now; translations are on the way.',
    'writing.title': 'Writing',
    'writing.notice': 'This essay is written in Chinese. The original text follows — an English translation is on the way.',
    'writing.badge': 'In Chinese',
    'photos.title': 'Photos',
    'photos.back': '← All photos',
    'photos.first': 'First photo',
    'photos.last': 'Last photo',
    'photos.prevnext': 'Previous / Next',
    'projects.title': 'Projects',
    'vlog.title': 'Vlog',
    'life.title': 'Life',
    'notfound.title': 'Page not found',
    'notfound.sub': 'The page you are looking for has moved, or never existed.',
    'notfound.back': 'Back to home',
    'video.unsupported': 'Your browser does not support video playback.',
  },
} as const;

export type UiKey = keyof (typeof ui)['zh'];

export function t(lang: Lang, key: UiKey, vars?: Record<string, string | number>): string {
  let s: string = ui[lang][key];
  if (vars) {
    for (const k of Object.keys(vars)) s = s.replace('{' + k + '}', String(vars[k]));
  }
  return s;
}
