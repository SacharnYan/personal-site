export type ShelfCategory = 'books' | 'essays' | 'films' | 'talks';
export type ShelfKind = 'book' | 'paper' | 'poster' | 'image';

export interface ShelfItem {
  slug: string;
  category: ShelfCategory;
  kind: ShelfKind;
  variant: string;
  title: string;
  title_en: string;
  by: string;
  by_en: string;
  source?: string;
  sourceLabel?: string;
  sourceLabel_en?: string;
  image?: string;
}

export const shelfItems: ShelfItem[] = [
  { slug: 'within-the-system', category: 'books', kind: 'book', variant: 'mint', title: '置身事内', title_en: 'Within the System', by: '兰小欢', by_en: 'Lan Xiaohuan' },
  { slug: 'to-live', category: 'books', kind: 'book', variant: 'sepia', title: '活着', title_en: 'To Live', by: '余华', by_en: 'Yu Hua' },
  { slug: 'economic-machine', category: 'essays', kind: 'paper', variant: 'paper', title: '经济机器是怎样运行的', title_en: 'How the Economic Machine Works', by: 'Ray Dalio', by_en: 'Ray Dalio' },
  { slug: 'ming-dynasty', category: 'books', kind: 'book', variant: 'sand', title: '明朝那些事儿', title_en: 'Those Things About the Ming Dynasty', by: '当年明月', by_en: 'Dangnian Mingyue' },
  { slug: 'naval-almanack', category: 'books', kind: 'book', variant: 'red', title: '纳瓦尔宝典', title_en: 'The Almanack of Naval Ravikant', by: 'Eric Jorgenson', by_en: 'Eric Jorgenson' },
  { slug: 'make-something-wonderful', category: 'books', kind: 'book', variant: 'white', title: 'Make Something Wonderful', title_en: 'Make Something Wonderful', by: 'Steve Jobs', by_en: 'Steve Jobs', source: 'https://stevejobsarchive.com/book', sourceLabel: '在线阅读', sourceLabel_en: 'Read online' },
  { slug: 'central-county-cadres', category: 'essays', kind: 'paper', variant: 'paper', title: '中县干部', title_en: 'Cadres of a Central County', by: '冯军旗', by_en: 'Feng Junqi' },
  { slug: 'samsara', category: 'films', kind: 'poster', variant: 'black', title: '轮回', title_en: 'Samsara', by: 'Ron Fricke', by_en: 'Ron Fricke', source: 'https://www.bilibili.com/video/BV1Kx411b7BP', sourceLabel: '观看影片', sourceLabel_en: 'Watch film' },
  { slug: 'life-of-pi', category: 'books', kind: 'book', variant: 'navy', title: '少年派的奇幻漂流', title_en: 'Life of Pi', by: 'Yann Martel', by_en: 'Yann Martel' },
  { slug: 'coolshell', category: 'essays', kind: 'paper', variant: 'paper', title: '酷壳', title_en: 'CoolShell', by: '陈皓', by_en: 'Chen Hao', source: 'https://coolshell.cn/haoel', sourceLabel: '访问原站', sourceLabel_en: 'Visit original site' },
  { slug: 'designing-data-intensive-applications', category: 'books', kind: 'book', variant: 'orange', title: '数据密集型应用系统设计', title_en: 'Designing Data-Intensive Applications', by: 'Martin Kleppmann', by_en: 'Martin Kleppmann' },
  { slug: 'steve-jobs-stanford', category: 'talks', kind: 'poster', variant: 'charcoal', title: '斯坦福毕业演讲', title_en: 'Stanford Commencement Address', by: 'Steve Jobs', by_en: 'Steve Jobs', source: 'https://www.bilibili.com/video/BV1oW411h7Ea', sourceLabel: '观看演讲', sourceLabel_en: 'Watch talk' },
  { slug: 'naval-wisdom', category: 'talks', kind: 'poster', variant: 'blue', title: '生活、工作与智慧', title_en: 'Life, Work, and Wisdom', by: 'Naval Ravikant', by_en: 'Naval Ravikant', source: 'https://www.bilibili.com/video/BV1HW4y1i71t', sourceLabel: '观看访谈', sourceLabel_en: 'Watch interview' },
  { slug: 'seeking-wisdom', category: 'books', kind: 'book', variant: 'olive', title: '探寻智慧', title_en: 'Seeking Wisdom', by: 'Peter Bevelin', by_en: 'Peter Bevelin' },
  { slug: 'snow-at-huxin-pavilion', category: 'films', kind: 'image', variant: 'snow', title: '湖心亭看雪', title_en: 'Snow at Huxin Pavilion', by: '互动场景', by_en: 'Interactive scene', source: '/projects/snow/', sourceLabel: '进入场景', sourceLabel_en: 'Enter the scene', image: '/projects/snow/card.jpg' },
  { slug: 'rss-method', category: 'essays', kind: 'paper', variant: 'paper', title: '高效管理碎片化知识', title_en: 'Managing Fragmented Knowledge', by: 'RSS', by_en: 'RSS', source: 'https://www.bilibili.com/video/BV17E411L78o', sourceLabel: '观看视频', sourceLabel_en: 'Watch video' },
  { slug: 'fan-ho', category: 'films', kind: 'poster', variant: 'rose', title: '何藩', title_en: 'Fan Ho', by: '决定性瞬间', by_en: 'The Decisive Moment', source: 'https://www.bilibili.com/video/BV12741177X5', sourceLabel: '观看访谈', sourceLabel_en: 'Watch interview' },
  { slug: 'dream-of-red-chamber', category: 'films', kind: 'poster', variant: 'burgundy', title: '红楼梦', title_en: 'Dream of the Red Chamber', by: '舞剧', by_en: 'Dance drama', source: 'https://www.bilibili.com/video/BV1Ce411V7Bn', sourceLabel: '观看舞剧', sourceLabel_en: 'Watch performance' },
  { slug: 'taoan', category: 'books', kind: 'book', variant: 'cream', title: '陶庵梦忆', title_en: "Dream Reminiscences of Tao'an", by: '张岱', by_en: 'Zhang Dai' },
  { slug: 'evolutionary-psychology', category: 'books', kind: 'book', variant: 'yellow', title: '进化心理学', title_en: 'Evolutionary Psychology', by: 'David Buss', by_en: 'David Buss', source: 'https://www.bilibili.com/video/BV1kt411W7jk', sourceLabel: '观看课程', sourceLabel_en: 'Watch lecture' },
  { slug: 'where-china-comes-from', category: 'films', kind: 'poster', variant: 'graphite', title: '中国从哪里来', title_en: 'Where Does China Come From?', by: '地理视角', by_en: 'A geographic view', source: 'https://www.bilibili.com/video/BV1SU4y1A7wX', sourceLabel: '观看视频', sourceLabel_en: 'Watch video' },
  { slug: 'iron-man-arm', category: 'films', kind: 'poster', variant: 'steel', title: '钢铁侠机械臂', title_en: "Iron Man's Robotic Arm", by: '自制', by_en: 'Built from scratch', source: 'https://www.bilibili.com/video/BV12341117rG', sourceLabel: '观看视频', sourceLabel_en: 'Watch video' },
];
