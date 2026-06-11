export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', promptName: 'English' },
  { code: 'zh', label: '中文', flag: '🇨🇳', promptName: 'Simplified Chinese' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', promptName: 'Korean' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', promptName: 'Japanese' },
  { code: 'es', label: 'Español', flag: '🇪🇸', promptName: 'Spanish' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭', promptName: 'Thai' },
] as const

export type LanguageCode = typeof LANGUAGES[number]['code']

const translations = {
  en: {
    dreamTitle: 'What do you dream about?', dreamSubtitle: 'Say it naturally. We will turn it into steps you can start.',
    roadmapTitle: 'Dream Realizer', roadmapSubtitle: 'Your dream is becoming a practical plan.', roadmapReady: 'Roadmap ready',
    tellDream: 'Tell me what you dream about', dreamPlaceholder: 'I want to...', sendDream: 'Send dream',
    progress: 'Progress', stepsDone: 'steps done', editPlan: 'Edit Plan', endEdit: 'End Edit', schedule: 'Schedule', closeSchedule: 'Close Schedule',
    toolHint: 'Select an execution plan in the diagram to see the recommended AI tool and prompt.',
    recommendedPrompt: 'Recommended Prompt', generatingPrompt: 'Generating personalized prompt…', copy: 'Copy', copied: 'Copied!',
    openTool: 'Open', howToUse: 'How to use it', whyTool: 'Why this tool?', complete: 'Mark this step as done', undoComplete: 'Completed — tap to undo',
    realizing: 'Realizing your dream...', roadmapHint: 'Your words become a roadmap.', feasibility: 'Feasibility score', feasibilityText: 'estimates how achievable each step is with the current plan and AI tools.',
    zoomOut: 'Zoom out', zoomIn: 'Zoom in', reset: 'Reset', language: 'Language',
    connectionError: 'Connection error. Check your internet and try again.',
  },
  zh: {
    dreamTitle: '你的梦想是什么？', dreamSubtitle: '自然地说出来，我们会把它变成可以开始行动的步骤。',
    roadmapTitle: '梦想实现器', roadmapSubtitle: '你的梦想正在变成切实可行的计划。', roadmapReady: '路线图已就绪',
    tellDream: '告诉我你的梦想', dreamPlaceholder: '我想要……', sendDream: '发送梦想',
    progress: '进度', stepsDone: '个步骤已完成', editPlan: '编辑计划', endEdit: '结束编辑', schedule: '日程', closeSchedule: '关闭日程',
    toolHint: '在图中选择一个执行计划，查看推荐的 AI 工具和提示词。',
    recommendedPrompt: '推荐提示词', generatingPrompt: '正在生成个性化提示词…', copy: '复制', copied: '已复制！',
    openTool: '打开', howToUse: '使用方法', whyTool: '为什么选择此工具？', complete: '将此步骤标记为完成', undoComplete: '已完成 — 点击撤销',
    realizing: '正在实现你的梦想…', roadmapHint: '你的话语将变成路线图。', feasibility: '可行性评分', feasibilityText: '评估根据当前计划和 AI 工具完成每个步骤的可行程度。',
    zoomOut: '缩小', zoomIn: '放大', reset: '重置', language: '语言', connectionError: '连接错误，请检查网络后重试。',
  },
  ko: {
    dreamTitle: '어떤 꿈을 꾸고 있나요?', dreamSubtitle: '자연스럽게 말해 주세요. 바로 시작할 수 있는 단계로 만들어 드릴게요.',
    roadmapTitle: '꿈 실현 도우미', roadmapSubtitle: '꿈이 실행 가능한 계획으로 바뀌고 있습니다.', roadmapReady: '로드맵 준비 완료',
    tellDream: '꿈을 들려주세요', dreamPlaceholder: '나는 ...하고 싶어요', sendDream: '꿈 보내기',
    progress: '진행률', stepsDone: '단계 완료', editPlan: '계획 편집', endEdit: '편집 종료', schedule: '일정', closeSchedule: '일정 닫기',
    toolHint: '다이어그램에서 실행 계획을 선택하면 추천 AI 도구와 프롬프트를 볼 수 있습니다.',
    recommendedPrompt: '추천 프롬프트', generatingPrompt: '맞춤 프롬프트 생성 중…', copy: '복사', copied: '복사 완료!',
    openTool: '열기', howToUse: '사용 방법', whyTool: '이 도구를 추천하는 이유', complete: '이 단계 완료로 표시', undoComplete: '완료됨 — 눌러서 취소',
    realizing: '꿈을 실행 계획으로 만드는 중…', roadmapHint: '당신의 말이 로드맵이 됩니다.', feasibility: '실현 가능성 점수', feasibilityText: '현재 계획과 AI 도구로 각 단계를 달성할 가능성을 보여줍니다.',
    zoomOut: '축소', zoomIn: '확대', reset: '초기화', language: '언어', connectionError: '연결 오류입니다. 인터넷 연결을 확인하고 다시 시도해 주세요.',
  },
  ja: {
    dreamTitle: 'あなたの夢は何ですか？', dreamSubtitle: '自然に話してください。今すぐ始められるステップに変えます。',
    roadmapTitle: '夢実現サポート', roadmapSubtitle: '夢が実行可能な計画に変わっています。', roadmapReady: 'ロードマップ完成',
    tellDream: '夢を教えてください', dreamPlaceholder: '私は…したい', sendDream: '夢を送信',
    progress: '進捗', stepsDone: 'ステップ完了', editPlan: '計画を編集', endEdit: '編集終了', schedule: '予定', closeSchedule: '予定を閉じる',
    toolHint: '図の実行計画を選択すると、おすすめのAIツールとプロンプトが表示されます。',
    recommendedPrompt: 'おすすめプロンプト', generatingPrompt: '個別プロンプトを生成中…', copy: 'コピー', copied: 'コピー完了！',
    openTool: '開く', howToUse: '使い方', whyTool: 'このツールを選ぶ理由', complete: 'このステップを完了にする', undoComplete: '完了済み — タップして取り消す',
    realizing: '夢を計画に変換中…', roadmapHint: 'あなたの言葉がロードマップになります。', feasibility: '実現可能性スコア', feasibilityText: '現在の計画とAIツールで各ステップを達成できる可能性を示します。',
    zoomOut: '縮小', zoomIn: '拡大', reset: 'リセット', language: '言語', connectionError: '接続エラーです。インターネットを確認して再試行してください。',
  },
  es: {
    dreamTitle: '¿Con qué sueñas?', dreamSubtitle: 'Cuéntalo con naturalidad. Lo convertiremos en pasos que puedas comenzar.',
    roadmapTitle: 'Realizador de Sueños', roadmapSubtitle: 'Tu sueño se está convirtiendo en un plan práctico.', roadmapReady: 'Ruta lista',
    tellDream: 'Cuéntame tu sueño', dreamPlaceholder: 'Quiero...', sendDream: 'Enviar sueño',
    progress: 'Progreso', stepsDone: 'pasos completados', editPlan: 'Editar plan', endEdit: 'Terminar edición', schedule: 'Calendario', closeSchedule: 'Cerrar calendario',
    toolHint: 'Selecciona un plan de ejecución en el diagrama para ver la herramienta de IA y el prompt recomendados.',
    recommendedPrompt: 'Prompt recomendado', generatingPrompt: 'Generando prompt personalizado…', copy: 'Copiar', copied: '¡Copiado!',
    openTool: 'Abrir', howToUse: 'Cómo usarlo', whyTool: '¿Por qué esta herramienta?', complete: 'Marcar este paso como completado', undoComplete: 'Completado — toca para deshacer',
    realizing: 'Convirtiendo tu sueño en realidad…', roadmapHint: 'Tus palabras se convierten en una ruta.', feasibility: 'Puntuación de viabilidad', feasibilityText: 'estima qué tan alcanzable es cada paso con el plan y las herramientas de IA actuales.',
    zoomOut: 'Alejar', zoomIn: 'Acercar', reset: 'Restablecer', language: 'Idioma', connectionError: 'Error de conexión. Revisa Internet e inténtalo de nuevo.',
  },
  th: {
    dreamTitle: 'คุณฝันถึงอะไรอยู่?', dreamSubtitle: 'เล่าได้อย่างเป็นธรรมชาติ เราจะเปลี่ยนให้เป็นขั้นตอนที่เริ่มทำได้ทันที',
    roadmapTitle: 'ผู้ช่วยทำฝันให้เป็นจริง', roadmapSubtitle: 'ความฝันของคุณกำลังกลายเป็นแผนที่ทำได้จริง', roadmapReady: 'แผนพร้อมแล้ว',
    tellDream: 'บอกความฝันของคุณ', dreamPlaceholder: 'ฉันอยาก...', sendDream: 'ส่งความฝัน',
    progress: 'ความคืบหน้า', stepsDone: 'ขั้นตอนเสร็จแล้ว', editPlan: 'แก้ไขแผน', endEdit: 'จบการแก้ไข', schedule: 'กำหนดการ', closeSchedule: 'ปิดกำหนดการ',
    toolHint: 'เลือกแผนการดำเนินงานในแผนภาพเพื่อดูเครื่องมือ AI และพรอมต์ที่แนะนำ',
    recommendedPrompt: 'พรอมต์แนะนำ', generatingPrompt: 'กำลังสร้างพรอมต์เฉพาะบุคคล…', copy: 'คัดลอก', copied: 'คัดลอกแล้ว!',
    openTool: 'เปิด', howToUse: 'วิธีใช้งาน', whyTool: 'ทำไมจึงเลือกเครื่องมือนี้?', complete: 'ทำเครื่องหมายขั้นตอนนี้ว่าเสร็จแล้ว', undoComplete: 'เสร็จแล้ว — แตะเพื่อยกเลิก',
    realizing: 'กำลังเปลี่ยนความฝันเป็นแผน…', roadmapHint: 'คำพูดของคุณจะกลายเป็นแผนงาน', feasibility: 'คะแนนความเป็นไปได้', feasibilityText: 'ประเมินว่าแต่ละขั้นตอนทำสำเร็จได้มากน้อยเพียงใดด้วยแผนและเครื่องมือ AI ปัจจุบัน',
    zoomOut: 'ย่อ', zoomIn: 'ขยาย', reset: 'รีเซ็ต', language: 'ภาษา', connectionError: 'เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export function translate(language: LanguageCode, key: TranslationKey): string {
  return translations[language][key] ?? translations.en[key]
}

export function languagePromptName(language: LanguageCode): string {
  return LANGUAGES.find(item => item.code === language)?.promptName ?? 'English'
}
