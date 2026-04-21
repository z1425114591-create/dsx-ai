import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Link2,
  X,
  Camera,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Tag,
  Video,
  Play,
  LayoutGrid,
  Library,
  FolderOpen,
  User,
  Clock,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

// ============= Types =============
type PhaseType = 'welcome' | 'upload' | 'scanning' | 'info' | 'tags' | 'generating' | 'done' | 'warning';
type CardType = 'upload-image' | 'scanning' | 'scan-warning' | 'info-confirm' | 'tag-select' | 'generating' | 'done';

interface Message {
  id: string;
  role: 'ai' | 'user';
  text?: string;
  card?: CardType;
  cardData?: Record<string, unknown>;
  timestamp: number;
}

interface Category {
  id: string;
  emoji: string;
  label: string;
  sub: string;
}

interface Field {
  label: string;
  value: string;
  confidence?: 'high' | 'low' | 'fail';
}

interface RecognitionData {
  catLabel: string;
  fields: Field[];
  factTags: string[];
  marketingTags: string[];
  extraTags: string[];
  materials: string[];
}

// ============= Constants =============
const CATEGORIES: Category[] = [
  { id: 'local', emoji: '🏠', label: '本地生活', sub: '家政·装修·维修·回收' },
  { id: 'car', emoji: '🚗', label: '二手车', sub: '轿车·SUV·新能源' },
  { id: 'house', emoji: '🏢', label: '二手房', sub: '住宅·公寓·别墅' },
  { id: 'rent', emoji: '🔑', label: '租房', sub: '整租·合租·公寓' },
  { id: 'job', emoji: '💼', label: '招聘', sub: '全职·兼职·急招' },
];

const PLATFORM_HINTS = [
  { name: '58同城', icon: '🔵', color: 'bg-blue-50 border-blue-200 text-blue-600' },
  { name: '安居客', icon: '🟢', color: 'bg-green-50 border-green-200 text-green-600' },
  { name: '赞房网', icon: '🟡', color: 'bg-yellow-50 border-yellow-200 text-yellow-600' },
  { name: '自如家', icon: '🟠', color: 'bg-orange-50 border-orange-200 text-orange-600' },
  { name: '车天下', icon: '⚫', color: 'bg-gray-50 border-gray-200 text-gray-600' },
  { name: '瓜子二手车', icon: '🟣', color: 'bg-purple-50 border-purple-200 text-purple-600' },
];

const RECOGNITION_DATA: Record<string, RecognitionData> = {
  car: {
    catLabel: '二手车',
    fields: [
      { label: '服务城市', value: '上海' },
      { label: '品牌车型', value: '大众 途观L' },
      { label: '年份颜色', value: '2021年 / 星空灰' },
      { label: '表显里程', value: '3.2万公里' },
      { label: '变速箱', value: '7速DSG双离合' },
    ],
    factTags: ['#途观L', '#2021年', '#3.2万公里', '#2.0T'],
    marketingTags: ['#个人一手', '#准新车', '#全程4S保养'],
    extraTags: ['#无事故', '#手续齐全', '#可验车', '#价格可谈'],
    materials: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200&h=200&fit=crop',
    ],
  },
  local: {
    catLabel: '本地生活',
    fields: [
      { label: '服务项目', value: '深度保洁' },
      { label: '服务时长', value: '3小时' },
      { label: '服务范围', value: '100㎡以内' },
      { label: '预约时间', value: '明天 10:00' },
      { label: '客户评价', value: '4.9分 · 1286次服务' },
    ],
    factTags: ['#深度保洁', '#3小时', '#100㎡', '#明天可用'],
    marketingTags: ['#好评如潮', '#专业团队', '#售后无忧'],
    extraTags: ['#就近派单', '#材料自备', '#不满意返工', '#限时优惠'],
    materials: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1527515637462-cff94edd56f1?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200&h=200&fit=crop',
    ],
  },
  house: {
    catLabel: '二手房',
    fields: [
      { label: '小区名称', value: '绿地海珀外滩' },
      { label: '房屋户型', value: '3室2厅2卫' },
      { label: '建筑面积', value: '128㎡' },
      { label: '挂牌价格', value: '1280万' },
      { label: '房屋朝向', value: '南北通透' },
    ],
    factTags: ['#绿地海珀外滩', '#3室2厅', '#128㎡', '#南北通透'],
    marketingTags: ['#地铁沿线', '#学区房', '#配套成熟'],
    extraTags: ['#随时看房', '#诚意出售', '#满五唯一', '#精装修'],
    materials: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=200&fit=crop',
    ],
  },
  rent: {
    catLabel: '租房',
    fields: [
      { label: '房源标题', value: '徐汇滨江 品质公寓' },
      { label: '房屋户型', value: '1室1厅1卫' },
      { label: '建筑面积', value: '58㎡' },
      { label: '月租价格', value: '8500元/月' },
      { label: '付款方式', value: '押一付一' },
    ],
    factTags: ['#徐汇滨江', '#1室1厅', '#58㎡', '#押一付一'],
    marketingTags: ['#近地铁', '#精装修', '#独立卫浴'],
    extraTags: ['#随时入住', '#室友已定', '#可养宠物', '#有电梯'],
    materials: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&h=200&fit=crop',
    ],
  },
  job: {
    catLabel: '招聘',
    fields: [
      { label: '岗位名称', value: '高级前端工程师' },
      { label: '薪资范围', value: '25K-40K' },
      { label: '工作地点', value: '上海·浦东' },
      { label: '经验要求', value: '3-5年' },
      { label: '技能要求', value: 'React / Vue / TypeScript' },
    ],
    factTags: ['#高级前端', '#25K-40K', '#浦东', '#3-5年'],
    marketingTags: ['#六险一金', '#弹性工作', '#带薪年假'],
    extraTags: ['#技术氛围好', '#晋升空间大', '#免费三餐', '#股票期权'],
    materials: [
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200&h=200&fit=crop',
    ],
  },
};

const LOW_CONFIDENCE_FIELDS: Record<string, Field[]> = {
  car: [
    { label: '服务城市', value: '上海', confidence: 'high' },
    { label: '品牌车型', value: '大众', confidence: 'low' },
    { label: '年份颜色', value: '', confidence: 'fail' },
    { label: '表显里程', value: '', confidence: 'fail' },
    { label: '变速箱', value: '', confidence: 'fail' },
  ],
  local: [
    { label: '服务项目', value: '保洁', confidence: 'low' },
    { label: '服务时长', value: '', confidence: 'fail' },
    { label: '服务范围', value: '80㎡', confidence: 'high' },
    { label: '预约时间', value: '', confidence: 'fail' },
    { label: '客户评价', value: '4.8分', confidence: 'low' },
  ],
  house: [
    { label: '小区名称', value: '绿地', confidence: 'low' },
    { label: '房屋户型', value: '', confidence: 'fail' },
    { label: '建筑面积', value: '', confidence: 'fail' },
    { label: '挂牌价格', value: '1300万', confidence: 'low' },
    { label: '房屋朝向', value: '', confidence: 'fail' },
  ],
  rent: [
    { label: '房源标题', value: '品质公寓', confidence: 'low' },
    { label: '房屋户型', value: '1室1卫', confidence: 'high' },
    { label: '建筑面积', value: '55㎡', confidence: 'high' },
    { label: '月租价格', value: '', confidence: 'fail' },
    { label: '付款方式', value: '押一付三', confidence: 'low' },
  ],
  job: [
    { label: '岗位名称', value: '前端工程师', confidence: 'low' },
    { label: '薪资范围', value: '20K-35K', confidence: 'low' },
    { label: '工作地点', value: '上海', confidence: 'high' },
    { label: '经验要求', value: '', confidence: 'fail' },
    { label: '技能要求', value: 'JavaScript', confidence: 'low' },
  ],
};

// ============= Sub-Components =============

function StatusBar() {
  return (
    <div className="h-9 px-6 bg-white flex items-center justify-between">
      <span className="text-sm font-medium">18:02</span>
      <div className="flex items-center gap-1">
        <div className="w-1 h-1.5 bg-black rounded-sm" />
        <div className="w-1 h-2 bg-black rounded-sm" />
        <div className="w-1 h-2.5 bg-black rounded-sm" />
        <div className="w-1 h-3 bg-black rounded-sm" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm">92%</span>
        <div className="w-6 h-3 bg-black rounded-sm relative">
          <div className="absolute right-[2px] top-[2px] bottom-[2px] w-[70%] bg-green-500 rounded-sm" />
        </div>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
    </div>
  );
}

function AIBubble({ text }: { text: string }) {
  return (
    <motion.div
      className="flex gap-2 mb-3"
      initial={{ opacity: 0, x: -12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-8 h-8 rounded-full dsx-purple-gradient flex items-center justify-center flex-shrink-0">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-gray-100 max-w-[75%]">
        <p className="text-sm text-gray-800 leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      className="flex justify-end mb-3"
      initial={{ opacity: 0, x: 12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="dsx-purple-gradient rounded-2xl rounded-br-sm px-4 py-2.5 shadow-md max-w-[75%]">
        <p className="text-sm text-white leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      className="flex gap-2 mb-3"
      initial={{ opacity: 0, x: -12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-8 h-8 rounded-full dsx-purple-gradient flex items-center justify-center flex-shrink-0">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-purple-500"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function CategoryDropdown({
  show,
  selectedCat,
  onSelect,
  onClose,
}: {
  show: boolean;
  selectedCat: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={ref}
          className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 min-w-[180px] z-[200] overflow-hidden"
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                selectedCat === cat.id ? 'bg-purple-50' : ''
              }`}
              onClick={() => onSelect(cat.id)}
            >
              <span className="text-lg">{cat.emoji}</span>
              <div className="text-left flex-1">
                <div className="font-semibold text-sm text-gray-800">{cat.label}</div>
                <div className="text-xs text-gray-400">{cat.sub}</div>
              </div>
              {selectedCat === cat.id && <CheckCircle2 size={16} className="text-purple-500" />}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TopNav({
  selectedCat,
  onCatClick,
  showDropdown,
  onDropdownToggle,
}: {
  selectedCat: string;
  onCatClick: (id: string) => void;
  showDropdown: boolean;
  onDropdownToggle: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.id === selectedCat)!;

  return (
    <div className="h-11 px-4 bg-white border-b border-gray-100 flex items-center justify-between relative z-[50]">
      <div className="flex items-center gap-0.5">
        <img src="./logo.png" alt="大师兄AI" className="h-7" />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-sm text-gray-700 hover:bg-purple-100 transition-colors"
            onClick={onDropdownToggle}
          >
            <span>{cat.emoji}</span>
            <span className="font-medium">{cat.label}</span>
            <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          <CategoryDropdown
            show={showDropdown}
            selectedCat={selectedCat}
            onSelect={onCatClick}
            onClose={onDropdownToggle}
          />
        </div>
        <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
          <span>📚</span>
          <span>学习中心</span>
        </button>
      </div>
    </div>
  );
}

// 素材选择区组件
function MaterialSelectionArea({
  materials,
  onUpload,
  onRemove,
  onConfirm,
}: {
  materials: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      {/* 顶部标题行 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-gray-600">📎 选择素材</span>
        <button
          onClick={() => alert('功能即将上线')}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          素材库 &gt;
        </button>
      </div>

      {/* 图片格子横向滚动区 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* 上传按钮 */}
        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-purple-300 flex flex-col items-center justify-center cursor-pointer flex-shrink-0 hover:border-purple-500 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onUpload}
          />
          <span className="text-2xl text-purple-400">+</span>
          <span className="text-[10px] text-purple-400">上传素材</span>
        </label>

        {/* 图片缩略图 */}
        {materials.map((url, i) => (
          <div
            key={i}
            className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-4 h-4 bg-black/60 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/80"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 底部按钮 */}
      <button
        onClick={onConfirm}
        className="w-full py-3 mt-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
      >
        选好了
      </button>
    </motion.div>
  );
}

function UploadCard({
  catId,
  onUpload,
}: {
  catId: string;
  onUpload: (type: 'image' | 'link', materials?: string[]) => void;
}) {
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const [activeTab, setActiveTab] = useState<'image' | 'link'>('image');
  const [linkInput, setLinkInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkDone, setLinkDone] = useState(false);
  const [imageMaterials, setImageMaterials] = useState<string[]>([]);
  const [linkMaterials, setLinkMaterials] = useState<string[]>([]);

  const handleExtract = () => {
    if (!linkInput.trim()) return;
    setLinkLoading(true);
    setTimeout(() => {
      setLinkLoading(false);
      setLinkDone(true);
      setLinkMaterials(RECOGNITION_DATA[catId]?.materials || []);
    }, 2000);
  };

  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const files = e.target.files;
    if (!files) return;
    const newUrls = Array.from(files).map((file) => URL.createObjectURL(file));
    setter((prev) => [...prev, ...newUrls]);
    e.target.value = '';
  };

  const handleRemoveMaterial = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTabChange = (tab: 'image' | 'link') => {
    setActiveTab(tab);
    if (tab === 'image') {
      setLinkMaterials([]);
    } else {
      setImageMaterials([]);
    }
  };

  const handleImageConfirm = () => {
    onUpload('image', imageMaterials);
  };

  const handleLinkConfirm = () => {
    onUpload('link', linkMaterials);
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ml-9"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Tab Header */}
      <div className="flex border-b border-gray-100">
        <button
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'image' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400'
          }`}
          onClick={() => handleTabChange('image')}
        >
          <Camera size={16} />
          上传图片
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'link' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400'
          }`}
          onClick={() => handleTabChange('link')}
        >
          <Link2 size={16} />
          粘贴链接
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'image' ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="p-4"
          >
            <div className="text-center mb-3">
              <span className="text-lg mr-2">{cat.emoji}</span>
              <span className="font-medium text-gray-800">{cat.label} · 上传素材</span>
            </div>

            {/* 推荐素材进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>推荐素材进度</span>
                <span>1/3</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full dsx-purple-gradient"
                  initial={{ width: '33%' }}
                  animate={{ width: '33%' }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                {['产品主图', '环境场景图', '详情截图'].map((t, i) => (
                  <span
                    key={t}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* 素材选择区 */}
            <MaterialSelectionArea
              materials={imageMaterials}
              onUpload={(e) => handleMaterialUpload(e, setImageMaterials)}
              onRemove={(i) => handleRemoveMaterial(i, setImageMaterials)}
              onConfirm={handleImageConfirm}
            />
          </motion.div>
        ) : (
          <motion.div
            key="link"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="p-4"
          >
            <div className="text-center mb-3">
              <span className="text-lg mr-2">{cat.emoji}</span>
              <span className="font-medium text-gray-800">{cat.label} · 粘贴链接</span>
            </div>

            {/* Platform Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORM_HINTS.map((p) => (
                <span
                  key={p.name}
                  className={`text-xs px-2 py-1 rounded-full border ${p.color}`}
                >
                  {p.icon} {p.name}
                </span>
              ))}
            </div>

            {/* Link Input */}
            <div className="relative mb-4">
              <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={linkInput}
                onChange={(e) => {
                  setLinkInput(e.target.value);
                  setLinkDone(false);
                }}
                placeholder="粘贴第三方平台链接..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400"
              />
              {linkInput && (
                <button
                  onClick={() => {
                    setLinkInput('');
                    setLinkDone(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Extract Progress */}
            {linkLoading && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>正在提取...</span>
                  <span>提取中</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full dsx-purple-gradient"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2 }}
                  />
                </div>
              </div>
            )}

            {/* Extract Result */}
            {linkDone && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-gray-50 rounded-xl"
              >
                <p className="text-xs text-gray-500 mb-2">已提取到以下信息：</p>
                <div className="flex gap-2 mb-2">
                  {RECOGNITION_DATA[catId]?.fields.slice(0, 3).map((f) => (
                    <span key={f.label} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                      {f.label}: {f.value}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 素材选择区 - 仅在链接提取完成后显示 */}
            {linkDone && (
              <MaterialSelectionArea
                materials={linkMaterials}
                onUpload={(e) => handleMaterialUpload(e, setLinkMaterials)}
                onRemove={(i) => handleRemoveMaterial(i, setLinkMaterials)}
                onConfirm={handleLinkConfirm}
              />
            )}

            {!linkDone && (
              <button
                onClick={handleExtract}
                disabled={!linkInput.trim()}
                className="w-full py-3 rounded-xl dsx-purple-gradient text-white font-medium shadow-md shadow-purple-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                提取
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScanningCard({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([
    { label: 'OCR文字提取', done: false },
    { label: '品类智能判断', done: false },
    { label: '关键属性解析', done: false },
    { label: '营销标签生成', done: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onDone, 400);
          return 100;
        }
        const newProgress = p + 2;
        if (newProgress >= 25 && !steps[0].done) {
          setSteps((s) => [{ ...s[0], done: true }, ...s.slice(1)]);
        }
        if (newProgress >= 50 && !steps[1].done) {
          setSteps((s) => [s[0], { ...s[1], done: true }, ...s.slice(2)]);
        }
        if (newProgress >= 75 && !steps[2].done) {
          setSteps((s) => [...s.slice(0, 2), { ...s[2], done: true }, s[3]]);
        }
        if (newProgress >= 100 && !steps[3].done) {
          setSteps((s) => [...s.slice(0, 3), { ...s[3], done: true }]);
        }
        return newProgress;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [steps, onDone]);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ml-9"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="p-4 flex gap-4">
        {/* Image with scan line */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={RECOGNITION_DATA.car.materials[0]}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-purple-500/30" />
          <div className="absolute left-0 right-0 h-0.5 bg-white/80 scan-line" />
        </div>

        {/* Progress */}
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-800">AI 识别中...</span>
            <span className="text-sm font-medium text-purple-600">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full dsx-purple-gradient"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            {step.done ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <motion.div
                className="w-4 h-4 rounded-full bg-gray-200"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            )}
            <span className={`text-xs ${step.done ? 'text-green-600' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ScanWarningCard({
  catId,
  onContinue,
  onRetry,
}: {
  catId: string;
  onContinue: (filledCount: number) => void;
  onRetry: () => void;
}) {
  const fields = LOW_CONFIDENCE_FIELDS[catId] || [];
  const [editedFields, setEditedFields] = useState(fields);

  const handleFieldEdit = (index: number, value: string) => {
    setEditedFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  const filledCount = editedFields.filter((f) => f.value && f.value.trim() !== '').length;
  const totalCount = editedFields.length;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden ml-9"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Warning Banner */}
      <div className="bg-amber-50 px-4 py-2.5 flex items-center gap-2 border-b border-amber-100">
        <AlertTriangle size={16} className="text-amber-500" />
        <span className="text-sm font-medium text-amber-700">识别结果不完整</span>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> 已识别
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400" /> 置信度低
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> 未识别
        </span>
      </div>

      {/* Fields */}
      <div className="px-4 pb-3 space-y-2">
        {editedFields.map((field, i) => (
          <div key={field.label} className="flex items-center gap-2">
            <span className="w-20 text-xs text-gray-500">{field.label}</span>
            <input
              type="text"
              value={field.value}
              onChange={(e) => handleFieldEdit(i, e.target.value)}
              placeholder={field.confidence === 'fail' ? '未识别到' : ''}
              className={`flex-1 px-2 py-1.5 rounded-lg text-sm border focus:outline-none transition-colors ${
                field.confidence === 'fail'
                  ? 'border-red-200 bg-red-50 focus:border-red-400'
                  : field.confidence === 'low'
                  ? 'border-yellow-200 bg-yellow-50 focus:border-yellow-400'
                  : 'border-green-200 bg-green-50 focus:border-green-400'
              }`}
            />
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                field.confidence === 'fail'
                  ? 'bg-red-100 text-red-600'
                  : field.confidence === 'low'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              {field.confidence === 'fail' ? '未识别' : field.confidence === 'low' ? '低' : '高'}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          className="flex-1 py-2.5 rounded-xl dsx-purple-gradient text-white text-sm font-medium shadow-md shadow-purple-100"
          onClick={() => onContinue(filledCount)}
        >
          {filledCount === totalCount ? '信息完整，继续生成视频' : '跳过未填项，继续生成视频'}
        </button>
        <button
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          onClick={onRetry}
        >
          重新上传
        </button>
      </div>
    </motion.div>
  );
}

function InfoConfirmCard({
  catId,
  onConfirm,
}: {
  catId: string;
  onConfirm: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [fields, setFields] = useState(RECOGNITION_DATA[catId]?.fields || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleEdit = (index: number, value: string) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden ml-9"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-purple-500" />
          <span className="text-sm font-medium text-gray-800">请确认服务信息</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-purple-100 rounded transition-colors"
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }}>
            <ChevronDown size={16} className="text-gray-400" />
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {fields.map((field, i) => (
                <div key={field.label} className="flex items-center gap-2">
                  <span className="w-16 text-xs text-gray-500 flex-shrink-0">{field.label}</span>
                  {editingIndex === i ? (
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleEdit(i, e.target.value)}
                      onBlur={() => setEditingIndex(null)}
                      autoFocus
                      className="flex-1 px-2 py-1.5 rounded-lg text-sm border border-purple-200 bg-purple-50 focus:outline-none focus:border-purple-400"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingIndex(i)}
                      className="flex-1 px-2 py-1.5 rounded-lg text-sm text-gray-800 hover:bg-gray-50 text-left flex items-center justify-between"
                    >
                      {field.value}
                      <Edit3 size={12} className="text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pb-4">
        <button
          className="w-full py-3 rounded-xl dsx-purple-gradient text-white font-medium shadow-md shadow-purple-100"
          onClick={onConfirm}
        >
          确认信息，继续
        </button>
      </div>
    </motion.div>
  );
}

function TagSelectCard({
  catId,
  onConfirm,
}: {
  catId: string;
  onConfirm: (selectedTags: string[]) => void;
}) {
  const data = RECOGNITION_DATA[catId];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const visibleExtraTags = showMore ? data?.extraTags || [] : (data?.extraTags || []).slice(0, 2);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ml-9"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Tag size={16} className="text-purple-500" />
        <span className="text-sm font-medium text-gray-800">选择视频标签</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Fact Tags */}
        <div>
          <p className="text-xs text-gray-500 mb-2">客观信息标签（控制视频文案）</p>
          <div className="flex flex-wrap gap-2">
            {data?.factTags.map((tag, i) => (
              <motion.button
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.13, type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Marketing Tags */}
        <div>
          <p className="text-xs text-gray-500 mb-2">营销卖点标签（控制视频风格）</p>
          <div className="flex flex-wrap gap-2">
            {data?.marketingTags.map((tag, i) => (
              <motion.button
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (data.factTags.length + i) * 0.13, type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                }`}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Extra Tags */}
        <div>
          <p className="text-xs text-gray-500 mb-2">额外可选标签</p>
          <div className="flex flex-wrap gap-2">
            {visibleExtraTags.map((tag, i) => (
              <motion.button
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: (data.factTags.length + data.marketingTags.length + i) * 0.13,
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                }}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </motion.button>
            ))}
          </div>
          {data && data.extraTags.length > 2 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="mt-2 text-xs text-purple-500 hover:text-purple-600"
            >
              {showMore ? '收起' : '更多'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          className="w-full py-3 rounded-xl dsx-purple-gradient text-white font-medium shadow-md shadow-purple-100"
          onClick={() => onConfirm(selectedTags)}
        >
          确认标签（{selectedTags.length}个）
        </button>
      </div>
    </motion.div>
  );
}

function GeneratingCard({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([
    { label: '匹配视频模板', done: false },
    { label: '生成口播文案', done: false },
    { label: '合成视觉素材', done: false },
    { label: '添加字幕特效', done: false },
    { label: '输出最终视频', done: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onDone, 400);
          return 100;
        }
        const newProgress = p + 1;
        if (newProgress >= 20 && !steps[0].done) {
          setSteps((s) => [{ ...s[0], done: true }, ...s.slice(1)]);
        }
        if (newProgress >= 40 && !steps[1].done) {
          setSteps((s) => [s[0], { ...s[1], done: true }, ...s.slice(2)]);
        }
        if (newProgress >= 60 && !steps[2].done) {
          setSteps((s) => [...s.slice(0, 2), { ...s[2], done: true }, s[3], s[4]]);
        }
        if (newProgress >= 80 && !steps[3].done) {
          setSteps((s) => [...s.slice(0, 3), { ...s[3], done: true }, s[4]]);
        }
        if (newProgress >= 100 && !steps[4].done) {
          setSteps((s) => [...s.slice(0, 4), { ...s[4], done: true }]);
        }
        return newProgress;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [steps, onDone]);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ml-9"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="p-4 flex gap-4">
        {/* Spinning Icon */}
        <div className="w-14 h-14 rounded-full dsx-purple-gradient flex items-center justify-center flex-shrink-0">
          <Video className="text-white spin-icon" size={24} />
        </div>

        {/* Progress */}
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-800">视频生成中...</span>
            <span className="text-sm font-medium text-purple-600">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full dsx-purple-gradient"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 pb-4 space-y-2">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-2">
            {step.done ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
            )}
            <span className={`text-xs ${step.done ? 'text-green-600' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DoneCard({ catId, onReplay }: { catId: string; onReplay: () => void }) {
  const data = RECOGNITION_DATA[catId];

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ml-9"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Video Preview */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={data?.materials[0]}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
            <Play size={20} className="text-gray-800 ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-white text-xs flex items-center gap-1">
          <Clock size={10} />
          00:30
        </div>
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 dsx-purple-gradient rounded text-white text-xs">
          大师兄AI制作
        </div>
      </div>

      {/* Tags */}
      <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-gray-100">
        {[...data?.factTags.slice(0, 3), ...data?.marketingTags.slice(0, 3)].map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Share Platforms */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-2">分享到</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: '抖音', bg: 'bg-black', icon: '🎵' },
            { name: '小红书', bg: 'bg-red-500', icon: '📕' },
            { name: '快手', bg: 'bg-orange-500', icon: '⚡' },
            { name: '视频号', bg: 'bg-green-500', icon: '📺' },
          ].map((p) => (
            <button
              key={p.name}
              className={`${p.bg} rounded-xl py-2.5 flex flex-col items-center gap-1`}
            >
              <span>{p.icon}</span>
              <span className="text-white text-xs">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-3">
        <button
          onClick={onReplay}
          className="w-full py-2.5 rounded-xl dsx-purple-gradient text-white text-sm font-medium shadow-md shadow-purple-100"
        >
          再做一个
        </button>
      </div>
    </motion.div>
  );
}

function TabNav() {
  return (
    <div className="h-[60px] bg-white border-t border-gray-100 flex items-center justify-around px-2">
      {[
        { icon: LayoutGrid, label: '模板' },
        { icon: Library, label: '素材库' },
        { icon: Sparkles, label: '创作', special: true },
        { icon: FolderOpen, label: '作品库', badge: 26 },
        { icon: User, label: '我的' },
      ].map((tab) => (
        <button
          key={tab.label}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
            tab.special ? '-mt-4' : ''
          }`}
        >
          {tab.special ? (
            <div className="w-12 h-12 rounded-full dsx-purple-gradient flex items-center justify-center shadow-lg shadow-purple-200">
              <tab.icon size={22} className="text-white" />
            </div>
          ) : (
            <>
              <div className="relative">
                <tab.icon size={22} className="text-gray-400" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400">{tab.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function InputBar({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-t border-gray-100">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="描述行业灵感快速创作营销视频"
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-purple-400"
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="w-10 h-10 rounded-full dsx-purple-gradient flex items-center justify-center disabled:opacity-40 shadow-md shadow-purple-100"
        >
          <Sparkles size={18} className="text-white" />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-2">以上内容由AI生成</p>
    </div>
  );
}

// ============= Main Component =============

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<PhaseType>('welcome');
  const [selectedCat, setSelectedCat] = useState('car');
  const selectedCatRef = useRef('car');
  const [, setSelectedTags] = useState<string[]>([]);
  const [activeCardMsgId, setActiveCardMsgId] = useState<string | null>(null);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  const getMsgId = () => {
    msgIdRef.current += 1;
    return `msg_${msgIdRef.current}`;
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Initialize
  useEffect(() => {
    const timer1 = setTimeout(() => {
      const msg1: Message = {
        id: getMsgId(),
        role: 'ai',
        text: '你好！我是大师兄AI，帮你快速制作营销视频 🎬',
        timestamp: Date.now(),
      };
      setMessages([msg1]);
    }, 400);

    const timer2 = setTimeout(() => {
      const msg2: Message = {
        id: getMsgId(),
        role: 'ai',
        text: '上传图片或粘贴第三方平台链接，AI自动提取信息并生成视频 📸',
        card: 'upload-image',
        cardData: { catId: selectedCat },
        timestamp: Date.now() + 1,
      };
      setMessages((prev) => [...prev, msg2]);
      setActiveCardMsgId(msg2.id);
      setPhase('upload');
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const addAI = useCallback(
    (text: string, delay = 600, card?: CardType, cardData?: Record<string, unknown>) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const msg: Message = {
          id: getMsgId(),
          role: 'ai',
          text,
          card,
          cardData,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, msg]);
        if (card) setActiveCardMsgId(msg.id);
        scrollToBottom();
      }, delay);
    },
    [scrollToBottom]
  );

  const addUser = useCallback(
    (text: string) => {
      const msg: Message = {
        id: getMsgId(),
        role: 'user',
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    },
    [scrollToBottom]
  );

  const handleCatChange = useCallback(
    (catId: string) => {
      if (catId === selectedCatRef.current) {
        setShowCatDropdown(false);
        return;
      }
      setSelectedCat(catId);
      selectedCatRef.current = catId;
      setShowCatDropdown(false);
      msgIdRef.current = 0;
      setMessages([]);
      setPhase('welcome');
      setSelectedTags([]);
      setActiveCardMsgId(null);

      const cat = CATEGORIES.find((c) => c.id === catId)!;
      addAI(`已切换到「${cat.label}」品类，请重新上传素材或粘贴平台链接：`, 600);

      setTimeout(() => {
        const msg2: Message = {
          id: getMsgId(),
          role: 'ai',
          text: '',
          card: 'upload-image',
          cardData: { catId },
          timestamp: Date.now() + 1,
        };
        setMessages((prev) => [...prev, msg2]);
        setActiveCardMsgId(msg2.id);
        setPhase('upload');
      }, 600);
    },
    [addAI]
  );

  const handleUpload = useCallback(
    (type: 'image' | 'link', _materials?: string[]) => {
      const msgText = type === 'image' ? '已上传图片，开始识别' : `已提交链接：${inputVal.slice(0, 30)}...`;
      addUser(msgText);
      setPhase('scanning');

      setTimeout(() => {
        addAI(
          type === 'image'
            ? '收到！AI正在识别图片信息，请稍候...'
            : '收到！AI正在解析链接内容，提取文字与图片信息...',
          200,
          'scanning'
        );
      }, 200);
    },
    [addUser, addAI, inputVal]
  );

  const handleScanDone = useCallback(() => {
    const shouldWarn = Math.random() < 0.4;
    if (shouldWarn) {
      setPhase('warning');
    } else {
      setPhase('info');
    }
  }, []);

  const handleWarningContinue = useCallback(
    (_filledCount: number) => {
      addUser('已补充完成，继续生成视频');
      setPhase('tags');
      setTimeout(() => {
        addAI('', 400, 'tag-select');
      }, 200);
    },
    [addUser, addAI]
  );

  const handleWarningRetry = useCallback(() => {
    addUser('重新上传图片');
    setPhase('upload');
    setTimeout(() => {
      const msg: Message = {
        id: getMsgId(),
        role: 'ai',
        text: '',
        card: 'upload-image',
        cardData: { catId: selectedCatRef.current },
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      setActiveCardMsgId(msg.id);
    }, 200);
  }, [addUser]);

  const handleInfoConfirm = useCallback(() => {
    addUser('信息确认无误');
    setPhase('tags');
    setTimeout(() => {
      addAI('', 400, 'tag-select');
    }, 200);
  }, [addUser, addAI]);

  const handleTagConfirm = useCallback(
    (tags: string[]) => {
      setSelectedTags(tags);
      addUser(`已选择 ${tags.length} 个标签：${tags.join('、')}`);
      setPhase('generating');
      setTimeout(() => {
        addAI('完美！素材已就绪，正在为你生成专属营销视频，大约30秒... 🎬', 400, 'generating');
      }, 200);
    },
    [addUser, addAI]
  );

  const handleGenerateDone = useCallback(() => {
    setPhase('done');
    addAI('🎉 视频生成完成！点击播放预览，满意后可一键分享到各平台。', 400, 'done');
  }, [addAI]);

  const handleReplay = useCallback(() => {
    msgIdRef.current = 0;
    setMessages([]);
    setPhase('welcome');
    setSelectedTags([]);
    setActiveCardMsgId(null);

    setTimeout(() => {
      const msg1: Message = {
        id: getMsgId(),
        role: 'ai',
        text: '你好！我是大师兄AI，帮你快速制作营销视频 🎬',
        timestamp: Date.now(),
      };
      setMessages([msg1]);
    }, 200);

    setTimeout(() => {
      const msg2: Message = {
        id: getMsgId(),
        role: 'ai',
        text: '上传图片或粘贴第三方平台链接，AI自动提取信息并生成视频 📸',
        card: 'upload-image',
        cardData: { catId: selectedCatRef.current },
        timestamp: Date.now() + 1,
      };
      setMessages((prev) => [...prev, msg2]);
      setActiveCardMsgId(msg2.id);
      setPhase('upload');
    }, 800);
  }, []);

  const handleInputSend = useCallback(() => {
    if (!inputVal.trim()) return;
    addUser(inputVal);
    setInputVal('');
    setPhase('welcome');
    setSelectedTags([]);
    setActiveCardMsgId(null);

    setTimeout(() => {
      addAI('好的！请上传图片或粘贴平台链接，让我为你创作视频 📸', 600, 'upload-image');
    }, 600);
  }, [inputVal, addUser, addAI]);

  const renderCard = (card: CardType, cardData?: Record<string, unknown>) => {
    const catId = (cardData?.catId as string) || selectedCat;

    switch (card) {
      case 'upload-image':
        return <UploadCard catId={catId} onUpload={handleUpload} />;
      case 'scanning':
        return <ScanningCard onDone={handleScanDone} />;
      case 'scan-warning':
        return <ScanWarningCard catId={catId} onContinue={handleWarningContinue} onRetry={handleWarningRetry} />;
      case 'info-confirm':
        return <InfoConfirmCard catId={catId} onConfirm={handleInfoConfirm} />;
      case 'tag-select':
        return <TagSelectCard catId={catId} onConfirm={handleTagConfirm} />;
      case 'generating':
        return <GeneratingCard onDone={handleGenerateDone} />;
      case 'done':
        return <DoneCard catId={catId} onReplay={handleReplay} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dsx-gradient-bg">
      {/* Phone Frame */}
      <div className="relative overflow-visible" style={{ width: 384, maxWidth: '100%' }}>
        {/* Outer Frame */}
        <div className="phone-frame rounded-[44px] bg-white overflow-visible relative">
          {/* Status Bar */}
          <StatusBar />

          {/* Top Nav (outside overflow to stay visible) */}
          <div className="absolute top-9 left-0 right-0 z-[50]">
            <TopNav
              selectedCat={selectedCat}
              onCatClick={handleCatChange}
              showDropdown={showCatDropdown}
              onDropdownToggle={() => setShowCatDropdown(!showCatDropdown)}
            />
          </div>

          {/* Inner Container with overflow hidden */}
          <div
            className="overflow-hidden rounded-[36px] flex flex-col"
            style={{ height: 780 - 36 - 60 }}
          >
            {/* Chat Area */}
            <div
              className="flex-1 overflow-y-auto px-3 pt-2"
              style={{ paddingTop: 44, backgroundImage: 'url(./chat-bg.png)', backgroundSize: 'cover' }}
            >
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'ai' ? (
                    <>
                      <AIBubble text={msg.text || ''} />
                      {msg.card && msg.id === activeCardMsgId && (
                        <div className="mb-3">{renderCard(msg.card, msg.cardData)}</div>
                      )}
                      {msg.card && msg.id !== activeCardMsgId && (
                        <div className="mb-3 ml-9">
                          <p className="text-xs text-gray-400 italic">（已处理）</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <UserBubble text={msg.text || ''} />
                  )}
                </div>
              ))}
              {isTyping && <TypingIndicator />}

              {/* Result Cards - 直接显示，不通过消息 */}
              <AnimatePresence>
                {phase === 'info' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3"
                  >
                    <InfoConfirmCard catId={selectedCat} onConfirm={handleInfoConfirm} />
                  </motion.div>
                )}
                {phase === 'warning' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3"
                  >
                    <ScanWarningCard catId={selectedCat} onContinue={handleWarningContinue} onRetry={handleWarningRetry} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* Input Bar - fixed at bottom */}
            <InputBar value={inputVal} onChange={setInputVal} onSend={handleInputSend} />
          </div>

          {/* Tab Nav */}
          <TabNav />
        </div>
      </div>
    </div>
  );
}