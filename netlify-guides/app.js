const videos = [
  { id: 'product', section: 'spoofer', title: 'شرح سبوفر تعن', description: 'الفيديو الأساسي لدليل المنتج. ابدأ به وشاهد الخطوات كاملة قبل تشغيل سبوفر.', type: 'mp4', url: 'https://t3nn.wtf/videos/product-guide-1016.mp4', thumbnail: 'assets/spoofer.png', label: 'الشرح الأساسي' },
  { id: 'wrp', section: 'spoofer', title: 'شرح WRP', description: 'خطوات WRP الإضافية بعد إكمال شرح المنتج عند استمرار الحظر أو الطرد.', type: 'mp4', url: 'https://t3nn.wtf/guides/wrp-guide.mp4', thumbnail: 'assets/wrp.jpg', label: 'شرح إضافي' },
  { id: 'win11', section: 'preparation', title: 'تجهيز فلاش Windows 11', description: 'شرح تجهيز فلاش Windows 11 قبل متابعة خطوات المنتج.', type: 'youtube', url: 'https://youtu.be/XZ-9RbqlA2k', videoId: 'XZ-9RbqlA2k', thumbnail: 'https://i.ytimg.com/vi/XZ-9RbqlA2k/hqdefault.jpg', label: 'Windows 11' },
  { id: 'win10', section: 'preparation', title: 'تجهيز فلاش Windows 10', description: 'شرح تجهيز فلاش Windows 10 قبل متابعة خطوات المنتج.', type: 'youtube', url: 'https://youtu.be/WaFxvUmsNWs', videoId: 'WaFxvUmsNWs', thumbnail: 'https://i.ytimg.com/vi/WaFxvUmsNWs/hqdefault.jpg', label: 'Windows 10' },
  { id: 'bios-msi', section: 'preparation', title: 'إعداد BIOS — MSI', description: 'موضع خيارات Wi‑Fi وBluetooth على لوحات MSI عند اتباع مسار BIOS.', type: 'streamable', url: 'https://streamable.com/n7q3dk', videoId: 'n7q3dk', label: 'BIOS' },
  { id: 'bios-gigabyte', section: 'preparation', title: 'إعداد BIOS — GIGABYTE / AORUS', description: 'شرح خيارات الاتصال في BIOS للوحات GIGABYTE وAORUS.', type: 'streamable', url: 'https://streamable.com/1qhn35', videoId: '1qhn35', label: 'BIOS' },
  { id: 'bios-asrock', section: 'preparation', title: 'إعداد BIOS — ASROCK', description: 'شرح إعدادات Wi‑Fi وBluetooth في BIOS للوحات ASROCK.', type: 'streamable', url: 'https://streamable.com/ec8u3s', videoId: 'ec8u3s', label: 'BIOS' },
  { id: 'raid', section: 'preparation', title: 'إعادة تثبيت RAID', description: 'فيديو تجهيز RAID. راجع التحذير واحتفظ بنسخة احتياطية قبل أي خطوة تمس الأقراص.', type: 'streamable', url: 'https://streamable.com/9o2zci', videoId: '9o2zci', label: 'RAID' },
  { id: 'disk', section: 'preparation', title: 'مشاكل القرص / Disk Guide', description: 'رابط فيديو المصدر يعيد 404 حاليًا، لذلك لا يمكن تشغيله حتى يُوفّر بديل.', type: 'unavailable', url: 'https://spiritx.wtf/cdn/0cab4d685f5ef464/8e0fd169486d5811.mp4', label: 'غير متاح حاليًا' },
  { id: 'network', section: 'issues', title: 'مشكلة الشبكة أو Wi‑Fi', description: 'فيديو حل رسالة فشل الاتصال أو تعذّر الوصول إلى اسم المضيف.', type: 'mp4', url: 'https://t3nn.wtf/guides/network-error-fix.mp4', thumbnail: 'assets/network.png', label: 'اتصال' },
  { id: 'time', section: 'issues', title: 'خطأ الوقت والتحقق', description: 'خطوات معالجة تنبيه مزامنة وقت Windows أو التحقق من التوقيع.', type: 'mp4', url: 'https://t3nn.wtf/guides/timer-error-fix.mp4', thumbnail: 'assets/time.png', label: 'Windows' },
  { id: 'menu', section: 'issues', title: 'قائمة البرنامج لا تظهر', description: 'شرح حالة عمل WebUI مع عدم ظهور قائمة سبوفر.', type: 'mp4', url: 'https://t3nn.wtf/spoofer-list-fix.mp4', thumbnail: 'assets/spoofer.png', label: 'تشغيل البرنامج' },
];

const sectionNames = { spoofer: 'شرح سبوفر', preparation: 'تجهيز الجهاز', issues: 'مشاكل شائعة' };
const normalize = (value) => value.toLocaleLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\u064B-\u065F\u0670ـ]/g, '').trim();
const dialog = document.querySelector('#video-dialog');
const player = document.querySelector('#player');
const search = document.querySelector('#search');
let activeFilter = 'all';
let lastTrigger = null;

function makeCard(video) {
  const card = document.createElement('article');
  card.className = `video-card${video.type === 'unavailable' ? ' is-unavailable' : ''}`;
  card.dataset.id = video.id;
  card.dataset.search = normalize(`${video.title} ${video.description} ${video.label}`);

  const media = document.createElement(video.type === 'unavailable' ? 'div' : 'button');
  media.className = 'card-media';
  if (video.type !== 'unavailable') {
    media.type = 'button';
    media.setAttribute('aria-label', `تشغيل ${video.title}`);
    media.addEventListener('click', () => openVideo(video, media));
  }
  if (video.thumbnail) {
    const thumbnail = document.createElement('img');
    thumbnail.src = video.thumbnail;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    media.append(thumbnail);
  }
  const kind = document.createElement('span');
  kind.className = 'media-kind';
  kind.textContent = video.label;
  const icon = document.createElement('span');
  icon.className = 'play-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = video.type === 'unavailable' ? '—' : '▶';
  media.append(kind, icon);

  const body = document.createElement('div');
  body.className = 'card-body';
  const title = document.createElement('h3');
  title.textContent = video.title;
  const description = document.createElement('p');
  description.textContent = video.description;
  const foot = document.createElement('div');
  foot.className = 'card-foot';
  const group = document.createElement('span');
  group.textContent = sectionNames[video.section];
  const action = document.createElement('button');
  action.type = 'button';
  action.textContent = video.type === 'unavailable' ? 'بانتظار رابط بديل' : 'مشاهدة الشرح ←';
  action.disabled = video.type === 'unavailable';
  if (!action.disabled) action.addEventListener('click', () => openVideo(video, action));
  foot.append(group, action);
  body.append(title, description, foot);
  card.append(media, body);
  return card;
}

for (const video of videos) {
  document.querySelector(`[data-section="${video.section}"]`).append(makeCard(video));
}

function applyFilters() {
  const term = normalize(search.value);
  let visible = 0;
  for (const section of document.querySelectorAll('.video-section')) {
    let sectionVisible = 0;
    for (const card of section.querySelectorAll('.video-card')) {
      const matches = (activeFilter === 'all' || activeFilter === section.querySelector('.cards').dataset.section) && (!term || card.dataset.search.includes(term));
      card.hidden = !matches;
      if (matches) { visible++; sectionVisible++; }
    }
    section.hidden = sectionVisible === 0;
  }
  document.querySelector('#empty-state').hidden = visible !== 0;
  document.querySelector('#results-status').textContent = visible ? `${visible} ${visible === 1 ? 'شرح' : 'شروحات'} متاحة للعرض` : 'لا توجد نتائج مطابقة';
}

for (const button of document.querySelectorAll('.filter')) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    for (const item of document.querySelectorAll('.filter')) {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    }
    applyFilters();
  });
}
search.addEventListener('input', applyFilters);
document.querySelector('#reset-search').addEventListener('click', () => {
  search.value = '';
  document.querySelector('[data-filter="all"]').click();
  search.focus();
});

function openVideo(video, trigger) {
  if (video.type === 'unavailable') return;
  lastTrigger = trigger;
  document.querySelector('#dialog-title').textContent = video.title;
  document.querySelector('#dialog-category').textContent = sectionNames[video.section];
  document.querySelector('#dialog-description').textContent = video.description;
  document.querySelector('#source-link').href = video.url;
  player.replaceChildren();

  let element;
  if (video.type === 'mp4') {
    element = document.createElement('video');
    element.src = video.url;
    element.controls = true;
    element.playsInline = true;
    element.preload = 'metadata';
    element.addEventListener('error', () => {
      player.replaceChildren();
      const message = document.createElement('p');
      message.className = 'player-error';
      message.textContent = 'تعذّر تشغيل الفيديو هنا. استخدم رابط المصدر أسفل المشغل.';
      player.append(message);
    });
  } else {
    element = document.createElement('iframe');
    element.src = video.type === 'youtube' ? `https://www.youtube-nocookie.com/embed/${video.videoId}` : `https://streamable.com/e/${video.videoId}`;
    element.title = video.title;
    element.allow = 'fullscreen; picture-in-picture';
    element.allowFullscreen = true;
    element.referrerPolicy = 'strict-origin-when-cross-origin';
  }
  player.append(element);
  dialog.showModal();
}

document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { player.replaceChildren(); lastTrigger?.focus(); });

applyFilters();
