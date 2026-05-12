import { Download, Info, Link, Settings } from 'lucide-react';
import { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('1080');
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [finalDownloadUrl, setFinalDownloadUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const handleDownload = async () => {
    if (!url.trim()) {
      setStatusText('الرجاء إدخال رابط فيديو صالح.');
      return;
    }

    setIsDownloading(true);
    setFinalDownloadUrl('');
    setVideoTitle('');
    setStatusText('جاري إعداد التحميل...');

    try {
      // 1. Init download via proxy
      const initRes = await fetch(`/api/loader/init?url=${encodeURIComponent(url)}&format=${format}`);
      const initData = await initRes.json();
      
      if (!initData.success) {
        throw new Error(initData.message || 'فشل في إعداد التحميل.');
      }

      setVideoTitle(initData.title || '');
      setStatusText('جاري المعالجة والتحويل... قد يستغرق ذلك بضع ثوانٍ.');
      
      const downloadId = initData.id;

      // 2. Poll for progress
      let retries = 0;
      const pollProgress = async () => {
        try {
          const progRes = await fetch(`/api/loader/progress?id=${downloadId}`);
          const progData = await progRes.json();

          if (progData.success === 1 && progData.download_url) {
            setFinalDownloadUrl(progData.download_url);
            setStatusText('جاهز للتحميل! اضغط على زر "تحميل الملف" أدناه.');
            setIsDownloading(false);
            return;
          } else if (progData.success === 0) {
            // Still in progress
            const progressNum = progData.progress || 0;
            const progressPercent = Math.min(100, Math.max(0, Math.round(progressNum / 10)));
            setStatusText(`جاري التحويل... ${progressPercent}% اكتمل.`);
            
            if (retries < 60) { // Timeout after ~2 minutes
              retries++;
              setTimeout(pollProgress, 2000);
            } else {
              throw new Error('انتهت مهلة التحويل.');
            }
          } else {
            throw new Error(progData.text || 'حدث خطأ أثناء التحويل.');
          }
        } catch (e: any) {
          setStatusText(e.message || 'حدث خطأ أثناء التحويل.');
          setIsDownloading(false);
        }
      };

      setTimeout(pollProgress, 2000);

    } catch (e: any) {
      console.error(e);
      setStatusText(e.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans text-right select-text p-4" dir="rtl">
      <div className="w-full max-w-4xl bg-slate-900 rounded-[40px] p-8 md:p-12 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
              مُحمّل الفيديوهات <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-purple-400">الذكي</span>
            </h1>
            <p className="text-slate-400 text-lg">تنزيل المحتوى من اليوتيوب ومواقع أخرى مباشرة</p>
          </div>
          <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Download className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Main Form */}
        <div className="relative z-10 space-y-8">
          {/* URL Input */}
          <div className="space-y-3">
            <label className="text-slate-300 font-bold mr-2 text-sm uppercase tracking-widest block">رابط الفيديو (YouTube, TikTok, Twitter...)</label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..." 
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-12 pr-6 py-5 text-blue-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors text-lg"
                dir="ltr"
              />
              <div className="absolute left-4 pointer-events-none">
                <Link className="w-6 h-6 text-slate-500" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Quality Selection */}
            <div className="space-y-3">
              <label className="text-slate-300 font-bold mr-2 text-sm uppercase tracking-widest block">الجودة/الصيغة</label>
              <div className="relative flex items-center">
                <select 
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pr-6 pl-12 py-4 text-white appearance-none focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  <option value="1080">فيديو مباشر الجودة عالية (1080p MP4)</option>
                  <option value="720">فيديو مباشر جودة متوسطة (720p MP4)</option>
                  <option value="480">فيديو مباشر جودة ضعيفة (480p MP4)</option>
                  <option value="mp3">صوت فقط (MP3)</option>
                </select>
                <div className="absolute left-4 pointer-events-none">
                  <Settings className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </div>
            
            {/* Status Section */}
            <div className="space-y-3 flex flex-col justify-end">
              {statusText && (
                <div className="rounded-2xl p-4 border text-sm flex items-start gap-3 w-full h-full bg-slate-950/50 border-slate-800/50 text-blue-300">
                  <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
                  <div className="flex flex-col gap-1">
                    {videoTitle && <strong className="text-blue-200 line-clamp-1 truncate" title={videoTitle}>{videoTitle}</strong>}
                    <p className="leading-relaxed">{statusText}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          {!finalDownloadUrl ? (
            <button 
              disabled={isDownloading}
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-6 mt-4 rounded-[24px] text-2xl font-black shadow-xl shadow-blue-500/10 transition-all hover:shadow-blue-500/20 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <span className="animate-pulse">جاري التحضير...</span>
              ) : (
                <>
                  <Download className="w-8 h-8 group-hover:translate-y-1 transition-transform" strokeWidth={3} />
                  تجهيز الرابط
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-4">
              <a 
                href={finalDownloadUrl}
                download
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-6 mt-4 rounded-[24px] text-2xl font-black shadow-xl shadow-emerald-500/10 transition-all hover:shadow-emerald-500/20 flex items-center justify-center gap-4 group cursor-pointer"
              >
                <Download className="w-8 h-8 group-hover:translate-y-1 transition-transform" strokeWidth={3} />
                تحميل الملف الآن
              </a>
              <button 
                onClick={() => setFinalDownloadUrl('')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-8 py-6 mt-4 rounded-[24px] text-lg font-bold transition-all shadow-xl"
              >
                رجوع
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4">
            <span className="px-3 py-1 bg-slate-950 text-slate-400 rounded-full text-xs font-bold border border-slate-800">Smart API</span>
          </div>
          <p className="text-slate-500 text-sm font-semibold">
            مع تحيات المطور <span className="text-blue-400 font-bold">Amir Lamay</span>
          </p>
        </div>
      </div>
    </div>
  );
}
