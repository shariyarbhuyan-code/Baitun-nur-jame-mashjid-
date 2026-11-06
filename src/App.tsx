/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Moon,
  Sunset,
  Sunrise,
  CloudSun,
  CloudRain,
  Compass,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  Calendar,
  BookOpen,
  Heart,
  RotateCcw,
  MapPin,
  CheckCircle2,
  Bell,
  Utensils
} from 'lucide-react';

// Bengali digit converter
const toBn = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
};

// Types
interface PrayerTime {
  id: string;
  nameBn: string;
  nameEn: string;
  nameAr: string;
  azan: string;       // HH:mm
  jamaat: string;     // HH:mm
  iconType: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jummah';
  descriptionBn: string;
  rewardBn: string;
  isFridaySpecial?: boolean;
}

interface WeatherData {
  temp: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherDesc: string;
  isDay: boolean;
  daily: Array<{
    date: string;
    dayName: string;
    maxTemp: number;
    minTemp: number;
    rainProb: number;
    weatherCode: number;
    weatherDesc: string;
  }>;
}

interface QuranVerse {
  surah: string;
  arabic: string;
  bengali: string;
  reference: string;
  category: string;
}

// Quran & Hadith dataset
const QURAN_VERSES: QuranVerse[] = [
  {
    surah: 'সূরা আল-বাকারাহ্ (আয়াত ৪৫)',
    arabic: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ',
    bengali: 'আর তোমরা ধৈর্য ও সালাতের মাধ্যমে সাহায্য প্রার্থনা কর; নিশ্চয় তা বিনীতদের ছাড়া অন্যদের কাছে কঠিন।',
    reference: 'কুরআনুল কারীম ২:৪৫',
    category: 'সালাত ও ধৈর্য'
  },
  {
    surah: 'সূরা আন-নূর (আয়াত ৩৫)',
    arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ',
    bengali: 'আল্লাহ আসমান ও জমিনের জ্যোতি (নূর)। তাঁর জ্যোতির উপমা যেন একটি দীপাধার, যাতে রয়েছে একটি প্রদীপ।',
    reference: 'কুরআনুল কারীম ২৪:৩৫',
    category: 'বাইতুন নূর মাহাত্ম্য'
  },
  {
    surah: 'সহীহ আল-বুখারী (হাদিস ৫২৮)',
    arabic: 'الصَّلَاةُ عَلَى وَقْتِهَا، ثُمَّ بِرُّ الْوَالِدَيْنِ، ثُمَّ الْجِهَادُ فِي سَبِيلِ اللَّهِ',
    bengali: 'রাসূলুল্লাহ (সা.)-কে জিজ্ঞাসা করা হলো: আল্লাহর কাছে সবচেয়ে প্রিয় আমল কোনটি? তিনি বললেন: যথাসময়ে সালাত আদায় করা।',
    reference: 'সহীহ বুখারী, হাদিস নং ৫২৮',
    category: 'সালাতের মর্যাদা'
  },
  {
    surah: 'সূরা আল-জুমুআহ (আয়াত ৯)',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ',
    bengali: 'হে ঈমানদারগণ! জুমার দিনে যখন সালাতের জন্য আহ্বান করা হয়, তখন তোমরা দ্রুত আল্লাহর স্মরণের দিকে ধাবিত হও।',
    reference: 'কুরআনুল কারীম ৬২:৯',
    category: 'পবিত্র জুমা'
  },
  {
    surah: 'সহীহ মুসলিম (হাদিস ৬৬৬)',
    arabic: 'مَنْ بَنَى مَسْجِدًا لِلَّهِ بَنَى اللَّهُ لَهُ فِي الْجَنَّةِ مِثْلَهُ',
    bengali: 'যে ব্যক্তি আল্লাহর সন্তুষ্টির উদ্দেশ্যে একটি মসজিদ নির্মাণ করবে, আল্লাহ তার জন্য জান্নাতে অনুরূপ একটি প্রাসাদ নির্মাণ করবেন।',
    reference: 'সহীহ মুসলিম, হাদিস নং ৬৬৬',
    category: 'মসজিদ নির্মাণ ও সেবা'
  }
];

// Open-Meteo weather code to Bengali descriptions
const getWeatherDescription = (code: number): string => {
  if (code === 0) return 'পরিষ্কার রোদোজ্জ্বল আকাশ';
  if (code === 1 || code === 2) return 'স্বচ্ছ হালকা মেঘযুক্ত';
  if (code === 3) return 'মেঘলা আকাশ';
  if (code >= 45 && code <= 48) return 'কুয়াশাচ্ছন্ন পরিবেশ';
  if (code >= 51 && code <= 55) return 'হালকা গুড়ি গুড়ি বৃষ্টি';
  if (code >= 61 && code <= 65) return 'স্বাভাবিক বর্ষণ ধারা';
  if (code >= 71 && code <= 77) return 'হিমশীতল বর্ষণ';
  if (code >= 80 && code <= 82) return 'বর্ষণমুখর ধারা';
  if (code >= 95) return 'বজ্রবিদ্যুৎসহ বৃষ্টি';
  return 'মনোরম নাতিশীতোষ্ণ আবহাওয়া';
};

export default function App() {
  // Current time & day
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [ambientMode, setAmbientMode] = useState<'auto' | 'day' | 'night'>('auto');
  
  // Modals state
  const [weatherModalOpen, setWeatherModalOpen] = useState<boolean>(false);
  const [qiblaModalOpen, setQiblaModalOpen] = useState<boolean>(false);
  const [tasbihModalOpen, setTasbihModalOpen] = useState<boolean>(false);
  const [ramadanModalOpen, setRamadanModalOpen] = useState<boolean>(false);
  const [azanModalOpen, setAzanModalOpen] = useState<boolean>(false);

  // Active sub-tabs in modals
  const [ramadanViewTab, setRamadanViewTab] = useState<'auto' | 'sehri' | 'iftar'>('auto');

  // Sliders and Audio state
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [tasbihCount, setTasbihCount] = useState<number>(0);
  const [tasbihDhikrIndex, setTasbihDhikrIndex] = useState<number>(0);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quran Verse auto-rotator
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVerseIndex((prev) => (prev + 1) % QURAN_VERSES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Open-Meteo Lakshmipur Weather (Lat: 23.0134, Long: 90.8715)
  useEffect(() => {
    const fetchLakshmipurWeather = async () => {
      try {
        setWeatherLoading(true);
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=23.0134&longitude=90.8715&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FDhaka'
        );
        if (!res.ok) throw new Error('Weather API error');
        const data = await res.json();

        const dayNamesBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

        const dailyForecast = (data.daily?.time || []).slice(0, 7).map((timeStr: string, idx: number) => {
          const d = new Date(timeStr);
          const dayName = idx === 0 ? 'আজ' : idx === 1 ? 'আগামীকাল' : dayNamesBn[d.getDay()];
          const code = data.daily?.weather_code?.[idx] ?? 0;
          return {
            date: timeStr,
            dayName,
            maxTemp: Math.round(data.daily?.temperature_2m_max?.[idx] ?? 29),
            minTemp: Math.round(data.daily?.temperature_2m_min?.[idx] ?? 20),
            rainProb: Math.round(data.daily?.precipitation_probability_max?.[idx] ?? 10),
            weatherCode: code,
            weatherDesc: getWeatherDescription(code),
          };
        });

        const currentCode = data.current?.weather_code ?? 0;
        setWeather({
          temp: Math.round(data.current?.temperature_2m ?? 27),
          apparentTemp: Math.round(data.current?.apparent_temperature ?? 28),
          humidity: Math.round(data.current?.relative_humidity_2m ?? 65),
          windSpeed: Math.round(data.current?.wind_speed_10m ?? 8),
          weatherCode: currentCode,
          weatherDesc: getWeatherDescription(currentCode),
          isDay: Boolean(data.current?.is_day ?? 1),
          daily: dailyForecast,
        });
      } catch (err) {
        console.warn('Using graceful Lakshmipur climate fallback:', err);
        setWeather({
          temp: 28,
          apparentTemp: 29,
          humidity: 68,
          windSpeed: 10,
          weatherCode: 1,
          weatherDesc: 'পরিষ্কার রোদোজ্জ্বল নির্মল আকাশ',
          isDay: true,
          daily: [
            { date: '2026-11-06', dayName: 'আজ', maxTemp: 30, minTemp: 21, rainProb: 15, weatherCode: 1, weatherDesc: 'স্বচ্ছ আকাশ' },
            { date: '2026-11-07', dayName: 'আগামীকাল', maxTemp: 31, minTemp: 22, rainProb: 10, weatherCode: 0, weatherDesc: 'রোদোজ্জ্বল' },
            { date: '2026-11-08', dayName: 'রবিবার', maxTemp: 29, minTemp: 20, rainProb: 20, weatherCode: 2, weatherDesc: 'আংশিক মেঘলা' },
            { date: '2026-11-09', dayName: 'সোমবার', maxTemp: 30, minTemp: 21, rainProb: 5, weatherCode: 0, weatherDesc: 'পরিষ্কার' },
            { date: '2026-11-10', dayName: 'মঙ্গলবার', maxTemp: 31, minTemp: 22, rainProb: 12, weatherCode: 1, weatherDesc: 'স্বচ্ছ রোদ' },
            { date: '2026-11-11', dayName: 'বুধবার', maxTemp: 29, minTemp: 21, rainProb: 25, weatherCode: 3, weatherDesc: 'মেঘযুক্ত' },
            { date: '2026-11-12', dayName: 'বৃহস্পতিবার', maxTemp: 28, minTemp: 20, rainProb: 30, weatherCode: 61, weatherDesc: 'হালকা বর্ষণ' },
          ],
        });
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchLakshmipurWeather();
  }, []);

  // Determine daylight status
  const currentHour = currentTime.getHours();
  const isActualDay = currentHour >= 5 && currentHour < 18;
  const isDayMode = ambientMode === 'auto' ? isActualDay : ambientMode === 'day';

  // Base prayer schedule for Dalal Bazar, Lakshmipur
  const prayers: PrayerTime[] = useMemo(() => [
    {
      id: 'fajr',
      nameBn: 'ফজর',
      nameEn: 'Fajr',
      nameAr: 'الفجر',
      azan: '05:00',
      jamaat: '05:30',
      iconType: 'fajr',
      descriptionBn: 'সুবেহ সাদিক হতে সূর্যোদয় পর্যন্ত',
      rewardBn: 'যে ব্যক্তি ফজর জামাতে আদায় করল, সে যেন সারারাত সালাত আদায় করল।'
    },
    {
      id: 'dhuhr',
      nameBn: 'যোহর',
      nameEn: 'Dhuhr',
      nameAr: 'الظهر',
      azan: '11:55',
      jamaat: '01:15',
      iconType: 'dhuhr',
      descriptionBn: 'সূর্য মধ্যাকাশ হতে পশ্চিমাকাশে ঢলার পর',
      rewardBn: 'যোহরের পূর্বে ৪ রাকাত সালাত আদায়কারীকে জাহান্নামের আগুন স্পর্শ করবে না।'
    },
    {
      id: 'asr',
      nameBn: 'আসর',
      nameEn: 'Asr',
      nameAr: 'العصر',
      azan: '03:55',
      jamaat: '04:30',
      iconType: 'asr',
      descriptionBn: 'সূর্য রক্তিম হওয়ার পূর্ব মুহূর্ত পর্যন্ত',
      rewardBn: 'যে ব্যক্তি দুই শীতল সময়ের (ফজর ও আসর) সালাত আদায় করবে, সে জান্নাতে প্রবেশ করবে।'
    },
    {
      id: 'maghrib',
      nameBn: 'মাগরিব',
      nameEn: 'Maghrib',
      nameAr: 'المغرب',
      azan: '05:18',
      jamaat: '05:25',
      iconType: 'maghrib',
      descriptionBn: 'সূর্যাস্তের ঠিক পর হতে পশ্চিমাকাশের লাল আভা থাকা পর্যন্ত',
      rewardBn: 'মাগরিবের পর যে ব্যক্তি ৬ রাকাত আওয়াবিন সালাত আদায় করে, তার ১২ বছরের ইবাদতের সওয়াব লাভ হয়।'
    },
    {
      id: 'isha',
      nameBn: 'এশা',
      nameEn: 'Isha',
      nameAr: 'العشاء',
      azan: '06:40',
      jamaat: '07:45',
      iconType: 'isha',
      descriptionBn: 'লাল আভা বিলীন হওয়া হতে মধ্যরাত পর্যন্ত',
      rewardBn: 'এশা ও ফজরের সালাত মুনাফিকদের জন্য সর্বাধিক ভারী; এর গুরুত্ব অপরিসীম।'
    },
    {
      id: 'jummah',
      nameBn: 'জুমা',
      nameEn: 'Jummah',
      nameAr: 'الجمعة',
      azan: '12:00',
      jamaat: '01:30',
      iconType: 'jummah',
      isFridaySpecial: true,
      descriptionBn: 'সাপ্তাহিক শ্রেষ্ঠ দিন - খুৎবা ও জামাত',
      rewardBn: 'জুমার দিন এমন একটি মুহূর্ত রয়েছে, যাতে বান্দা যা প্রার্থনা করে আল্লাহ তা কবুল করেন।'
    }
  ], []);

  // Determine Active and Next Waqt + Next Adhan Countdown
  const { activeWaqt, nextWaqt, countdownText, nextAdhanText, nextAdhanPrayerName } = useMemo(() => {
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const currentSeconds = currentTime.getSeconds();

    const schedule = [
      { id: 'fajr', start: 5 * 60 + 0, end: 6 * 60 + 20, name: 'ফজর', azanMin: 5 * 60 + 0 },
      { id: 'dhuhr', start: 11 * 60 + 55, end: 15 * 60 + 54, name: 'যোহর', azanMin: 11 * 60 + 55 },
      { id: 'asr', start: 15 * 60 + 55, end: 17 * 60 + 17, name: 'আসর', azanMin: 15 * 60 + 55 },
      { id: 'maghrib', start: 17 * 60 + 18, end: 18 * 60 + 39, name: 'মাগরিব', azanMin: 17 * 60 + 18 },
      { id: 'isha', start: 18 * 60 + 40, end: 24 * 60, name: 'এশা', azanMin: 18 * 60 + 40 },
    ];

    const isFriday = currentTime.getDay() === 5;

    let currentActive = 'isha';
    let nextUpcoming = 'fajr';
    let targetStart = 5 * 60; // Fajr next day default

    if (nowMinutes >= schedule[0].start && nowMinutes < schedule[1].start) {
      currentActive = 'fajr';
      nextUpcoming = isFriday ? 'jummah' : 'dhuhr';
      targetStart = schedule[1].start;
    } else if (nowMinutes >= schedule[1].start && nowMinutes < schedule[2].start) {
      currentActive = isFriday ? 'jummah' : 'dhuhr';
      nextUpcoming = 'asr';
      targetStart = schedule[2].start;
    } else if (nowMinutes >= schedule[2].start && nowMinutes < schedule[3].start) {
      currentActive = 'asr';
      nextUpcoming = 'maghrib';
      targetStart = schedule[3].start;
    } else if (nowMinutes >= schedule[3].start && nowMinutes < schedule[4].start) {
      currentActive = 'maghrib';
      nextUpcoming = 'isha';
      targetStart = schedule[4].start;
    } else if (nowMinutes >= schedule[4].start) {
      currentActive = 'isha';
      nextUpcoming = 'fajr';
      targetStart = 24 * 60 + schedule[0].start; // Next day Fajr
    } else {
      currentActive = 'isha';
      nextUpcoming = 'fajr';
      targetStart = schedule[0].start;
    }

    let diffSec = (targetStart * 60) - (nowMinutes * 60 + currentSeconds);
    if (diffSec < 0) diffSec += 24 * 60 * 60;

    const hours = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;

    const nextPrayerObj = prayers.find(p => p.id === nextUpcoming) || prayers[0];

    let cdText = '';
    let shortAdhanCd = '';
    if (hours > 0) {
      cdText = `${toBn(hours)} ঘণ্টা ${toBn(mins)} মিনিট ${toBn(secs)} সেকেন্ড`;
      shortAdhanCd = `${toBn(hours)} ঘণ্টা ${toBn(mins)} মিনিট`;
    } else {
      cdText = `${toBn(mins)} মিনিট ${toBn(secs)} সেকেন্ড`;
      shortAdhanCd = `${toBn(mins)} মিনিট ${toBn(secs)} সে.`;
    }

    return {
      activeWaqt: currentActive,
      nextWaqt: nextPrayerObj,
      countdownText: cdText,
      nextAdhanText: shortAdhanCd,
      nextAdhanPrayerName: nextPrayerObj.nameBn
    };
  }, [currentTime, prayers]);

  // Ramadan Sehri & Iftar Calculation for Lakshmipur
  const sehriIftarData = useMemo(() => {
    // Lakshmipur Sehri End: 04:55 AM, Iftar: 05:18 PM
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const currentSeconds = currentTime.getSeconds();

    const sehriEndMin = 4 * 60 + 55; // 04:55 AM
    const iftarStartMin = 17 * 60 + 18; // 05:18 PM

    let activePhase: 'sehri' | 'iftar' = 'iftar';
    let targetMin = iftarStartMin;
    let label = 'আজকের ইফতারের বাকি সময়';

    if (nowMinutes < sehriEndMin) {
      // Midnight to 04:55 AM -> Countdown to Sehri End
      activePhase = 'sehri';
      targetMin = sehriEndMin;
      label = 'সেহরির শেষ সময় বাকি';
    } else if (nowMinutes >= sehriEndMin && nowMinutes < iftarStartMin) {
      // 04:55 AM to 05:18 PM -> Countdown to Iftar
      activePhase = 'iftar';
      targetMin = iftarStartMin;
      label = 'ইফতারের বাকি সময়';
    } else {
      // After 05:18 PM -> Countdown to Tomorrow's Sehri End
      activePhase = 'sehri';
      targetMin = 24 * 60 + sehriEndMin;
      label = 'আগামীকালের সেহরি বাকি';
    }

    let diffSec = (targetMin * 60) - (nowMinutes * 60 + currentSeconds);
    if (diffSec < 0) diffSec += 24 * 60 * 60;

    const hours = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;

    let countdownStr = '';
    if (hours > 0) {
      countdownStr = `${toBn(hours)} ঘণ্টা ${toBn(mins)} মিনিট ${toBn(secs)} সে.`;
    } else {
      countdownStr = `${toBn(mins)} মিনিট ${toBn(secs)} সে.`;
    }

    return {
      sehriTime: '০৪:৫৫ ভোর',
      iftarTime: '০৫:১৮ সন্ধ্যা',
      activePhase,
      countdownStr,
      label,
      hours,
      mins,
      secs
    };
  }, [currentTime]);

  // Audio Azan Chime simulation
  const playAzanChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(554.37, audioCtx.currentTime + 1.2);
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 2.5);

      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 3.6);
      showNotification('সালাতের আযান বার্তা প্রতিধ্বনি হচ্ছে...');
    } catch {
      showNotification('অডিও সক্রিয় করা হয়েছে');
    }
  };

  const showNotification = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Tasbih Dhikr items
  const dhikrList = [
    { text: 'سُبْحَانَ اللَّهِ', bn: 'সুবহানাল্লাহ', meaning: 'আল্লাহ পরম পবিত্র ও সকল ত্রুটিমুক্ত', target: 33 },
    { text: 'الْحَمْدُ لِلَّهِ', bn: 'আলহামদুলিল্লাহ', meaning: 'সকল প্রশংসা আল্লাহর জন্য', target: 33 },
    { text: 'اللَّهُ أَكْبَرُ', bn: 'আল্লাহু আকবার', meaning: 'আল্লাহ সর্বশ্রেষ্ঠ ও মহান', target: 34 },
    { text: 'لَا إِلَهَ إِلَّا اللَّهُ', bn: 'লা ইলাহা ইল্লাল্লাহ', meaning: 'আল্লাহ ছাড়া কোনো উপাস্য নেই', target: 100 },
    { text: 'أَسْتَغْفِرُ اللَّهَ', bn: 'আস্তাগফিরুল্লাহ', meaning: 'আমি আল্লাহর কাছে ক্ষমা প্রার্থনা করছি', target: 100 }
  ];

  const currentDhikr = dhikrList[tasbihDhikrIndex];

  const handleTasbihClick = () => {
    const nextCount = tasbihCount + 1;
    setTasbihCount(nextCount);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  // Bengali Date Formatting
  const bengaliDateStr = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Dhaka'
    };
    const formatter = new Intl.DateTimeFormat('bn-BD', options);
    return formatter.format(currentTime);
  }, [currentTime]);

  const bengaliTimeStr = useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const s = currentTime.getSeconds();
    const period = h >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
    const displayHour = h % 12 || 12;
    return `${toBn(String(displayHour).padStart(2, '0'))}:${toBn(String(m).padStart(2, '0'))}:${toBn(String(s).padStart(2, '0'))} ${period}`;
  }, [currentTime]);

  // Convert 24-hr time string to 12-hr Bengali
  const formatTime12Bn = (time24: string) => {
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10);
    const displayH = h % 12 || 12;
    return `${toBn(displayH)}:${toBn(mStr)} ${h >= 12 ? (h >= 17 ? 'সন্ধ্যা' : 'দুপুর') : (h < 6 ? 'ভোর' : 'সকাল')}`;
  };

  // Active Ramadan animation view: auto or manual toggle
  const effectiveRamadanView = ramadanViewTab === 'auto' ? sehriIftarData.activePhase : ramadanViewTab;

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-1000 ${
      isDayMode ? 'bg-[#06111f] text-slate-100' : 'bg-[#030712] text-slate-100'
    } islamic-pattern-bg`}>
      
      {/* Background Animated Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className={`absolute -top-32 left-1/4 w-[650px] h-[650px] rounded-full blur-[140px] opacity-25 transition-all duration-1000 ${
            isDayMode 
              ? 'bg-gradient-to-tr from-amber-500 via-teal-400 to-emerald-400' 
              : 'bg-gradient-to-tr from-cyan-600 via-indigo-900 to-teal-500'
          }`} 
        />
        <div className="absolute top-1/2 -right-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-transparent blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-32 left-10 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/10 via-cyan-500/15 to-transparent blur-[140px] pointer-events-none" />
      </div>

      {/* =========================================================================
          CRITICAL FLOATING WIDGETS (Safely positioned with z-floating / z-9999)
         ========================================================================= */}

      {/* 1. FLOATING CORNER SEHRI & IFTAR RAMADAN BADGE */}
      <div className="fixed bottom-20 right-4 sm:right-6 z-floating">
        <button
          onClick={() => setRamadanModalOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full acrylic-glass border border-amber-400/40 text-amber-200 hover:border-amber-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
          aria-label="সেহরি ও ইফতার সময়সূচী"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-base">🌙</span>
          <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
            সেহরি ও ইফতারের সময়সূচী
          </span>
          <span className="text-[11px] text-amber-300/80 hidden md:inline">| লক্ষ্মীপুর</span>
        </button>
      </div>

      {/* 2. FLOATING CORNER WEATHER BADGE */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-floating">
        <button
          onClick={() => setWeatherModalOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-full acrylic-glass border border-teal-400/35 text-teal-200 hover:border-teal-300 hover:shadow-[0_0_25px_rgba(45,212,191,0.4)] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
          aria-label="লক্ষ্মীপুর আবহাওয়া বিস্তারিত"
        >
          <Sun className="w-4 h-4 text-amber-400 animate-spin-slow shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-white whitespace-nowrap">
            {weather ? `${toBn(weather.temp)}°C` : '২৭°C'} লক্ষ্মীপুর
          </span>
          <span className="text-xs text-teal-300/80 hidden sm:inline whitespace-nowrap">| লাইভ আবহাওয়া</span>
        </button>
      </div>

      {/* 3. FLOATING NEXT ADHAN LIVE NEON WIDGET */}
      <div className="fixed bottom-6 left-4 sm:left-6 z-floating hidden sm:block">
        <button
          onClick={() => setAzanModalOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full acrylic-glass border border-teal-400/40 text-teal-200 hover:border-teal-300 hover:shadow-[0_0_25px_rgba(45,212,191,0.45)] transition-all shadow-[0_4px_25px_rgba(0,0,0,0.5)] active:scale-95"
        >
          <span className="text-sm">🕌</span>
          <span className="text-xs font-bold text-white whitespace-nowrap">
            পরবর্তী আজান: <span className="text-amber-300">{nextAdhanPrayerName}</span>
          </span>
          <span className="text-xs text-teal-300 font-mono tabular-nums whitespace-nowrap">
            বাকি {nextAdhanText}
          </span>
        </button>
      </div>

      {/* Notification Toast */}
      {copiedNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-floating px-5 py-2.5 rounded-full acrylic-glass border border-emerald-400/50 text-emerald-200 text-sm font-medium shadow-[0_0_35px_rgba(16,185,129,0.45)] flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Header Bar - One Row, Three-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 w-full acrylic-glass border-b border-teal-500/20 px-4 sm:px-8 py-3.5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Zone 1: Brand Title (Single-line wordmark in display face) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl acrylic-glass border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap">
                বাইতুন নূর জামে মসজিদ
              </h1>
              <p className="text-xs text-teal-300/80 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                <span>কামন খোলা, দালাল বাজার, লক্ষ্মীপুর</span>
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Fast Utility Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#prayer-times" className="hover:text-teal-300 transition-colors whitespace-nowrap">সালাত সময়সূচি</a>
            <a href="#ramadan-section" className="hover:text-amber-300 transition-colors whitespace-nowrap">সেহরি ও ইফতার</a>
            <a href="#weather-dashboard" className="hover:text-teal-300 transition-colors whitespace-nowrap">৭ দিনের আবহাওয়া</a>
            <a href="#quran-hadith" className="hover:text-teal-300 transition-colors whitespace-nowrap">কুরআন ও হাদিস</a>
            <a href="#mosque-info" className="hover:text-teal-300 transition-colors whitespace-nowrap">মসজিদ পরিচিতি</a>
          </nav>

          {/* Zone 3: Interactive Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Ramadan Fast Trigger Button */}
            <button
              onClick={() => setRamadanModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg acrylic-glass border border-amber-400/40 text-amber-300 hover:border-amber-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="সেহরি ও ইফতার"
            >
              <span>🌙</span>
              <span className="hidden sm:inline">সেহরি ও ইফতার</span>
            </button>

            {/* Tasbih Modal Trigger */}
            <button
              onClick={() => setTasbihModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg acrylic-glass border border-teal-400/35 text-teal-300 hover:border-teal-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="ডিজিটাল তাসবীহ"
            >
              <Heart className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden sm:inline">তাসবীহ</span>
            </button>

            {/* Qibla Compass Trigger */}
            <button
              onClick={() => setQiblaModalOpen(true)}
              className="p-2 rounded-lg acrylic-glass border border-teal-400/30 text-teal-300 hover:border-teal-400 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] transition-all"
              title="ক্বিবলা দিক নির্দেশক"
              aria-label="ক্বিবলা দিক নির্দেশক"
            >
              <Compass className="w-4 h-4" />
            </button>

            {/* Audio Adhan Simulator */}
            <button
              onClick={() => {
                setIsAudioEnabled(!isAudioEnabled);
                playAzanChime();
              }}
              className={`p-2 rounded-lg acrylic-glass border transition-all ${
                isAudioEnabled 
                  ? 'border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]' 
                  : 'border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isAudioEnabled ? 'আযান সাউন্ড সক্রিয়' : 'আযান সাউন্ড শুনুন'}
              aria-label="আযান সাউন্ড"
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Day / Night Ambient Switcher */}
            <button
              onClick={() => setAmbientMode(isDayMode ? 'night' : 'day')}
              className="p-2 rounded-lg acrylic-glass border border-teal-400/30 text-amber-300 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
              title={isDayMode ? 'রাত্রিকালীন রূপ পরিবর্তন করুন' : 'দিবকালীন আলো দেখুন'}
              aria-label="দিবা/রাত্রি পরিবর্তন"
            >
              {isDayMode ? <Moon className="w-4 h-4 text-cyan-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative z-10">

        {/* HERO SECTION: Live Clock, Ramadan Quick Capsule & Next Prayer Countdown Banner */}
        <section className="relative rounded-3xl acrylic-glass border border-teal-500/30 p-6 sm:p-8 overflow-hidden shadow-[0_0_55px_rgba(45,212,191,0.15)]">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-bl from-teal-500/20 via-emerald-500/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Mosque Name & Hijri/Gregorian Live Date */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full acrylic-glass border border-teal-400/30 text-teal-300 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>লক্ষ্মীপুর লাইভ ওয়াক্ত, সেহরি-ইফতার ও আবহাওয়া</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                বাইতুন নূর <span className="neon-glow-cyan text-teal-300">জামে মসজিদ</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                কামন খোলা, দালাল বাজার, লক্ষ্মীপুর। আল্লাহর সন্তুষ্টি অর্জন ও একনিষ্ঠ ইবাদতের জন্য নিবেদিত এক পবিত্র প্রাঙ্গণ। যথাসময়ে সালাত আদায়ে জান্নাতের প্রতিশ্রুতি।
              </p>

              {/* Date & Location Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300 pt-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg acrylic-glass border border-white/10">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{bengaliDateStr}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg acrylic-glass border border-white/10">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span className="font-mono tabular-nums font-semibold text-teal-200">{bengaliTimeStr}</span>
                </div>
                <button
                  onClick={() => setRamadanModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg acrylic-glass border border-amber-400/40 text-amber-300 hover:border-amber-300 text-xs font-bold"
                >
                  <span>🌙</span>
                  <span>{sehriIftarData.label}: {sehriIftarData.countdownStr}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Next Prayer Live Countdown Widget */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl acrylic-glass border border-amber-400/45 shadow-[0_0_35px_rgba(245,158,11,0.25)] text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-teal-500/10 pointer-events-none" />
                
                <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                  পরবর্তী সালাত
                </span>

                <div className="my-2">
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {nextWaqt.nameBn} <span className="text-amber-400 text-xl font-normal">({nextWaqt.nameAr})</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    আজান: <span className="font-semibold text-teal-300">{formatTime12Bn(nextWaqt.azan)}</span> · জামাত: <span className="font-semibold text-amber-300">{formatTime12Bn(nextWaqt.jamaat)}</span>
                  </p>
                </div>

                {/* Countdown Time Display */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-teal-500/35 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400 animate-pulse" />
                  <span className="text-xs text-slate-400">বাকি সময়:</span>
                  <span className="text-sm sm:text-base font-bold text-teal-200 tracking-wide font-mono tabular-nums">
                    {countdownText}
                  </span>
                </div>

                {/* Motivational Quote */}
                <p className="text-[11px] text-slate-400 italic mt-3">
                  "{nextWaqt.rewardBn}"
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 1: Grand Islamic Mihrab Arch & 6-Waqt Prayer Schedule */}
        <section id="prayer-times" className="space-y-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full acrylic-glass border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>এক্রাইলিক গ্লাস ও লাইভ নিওন সালাত সময়সূচি</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              দৈনিক <span className="neon-glow-gold text-amber-400">৬ ওয়াক্ত সালাত</span> সময়সূচি
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              লক্ষ্মীপুরের স্থানীয় সৌর অবস্থান অনুযায়ী নির্ধারিত। সোনালী নিওন বর্ডার দ্বারা বর্তমান চলমান ওয়াক্ত নির্দেশিত।
            </p>
          </div>

          {/* Mihrab Islamic Arch Outer Frame */}
          <div className="relative p-4 sm:p-8 rounded-[40px] acrylic-glass border border-teal-500/35 shadow-[0_0_65px_rgba(45,212,191,0.18)] overflow-hidden">
            
            {/* Top Mihrab Silhouette Crest */}
            <div className="flex justify-center -mt-2 mb-6">
              <div className="px-8 py-2 rounded-full acrylic-glass border border-amber-400/40 text-amber-300 flex items-center gap-2 text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <span>✦</span>
                <span className="font-arabic text-base">مِحْرَابُ الصَّلَاةِ</span>
                <span>·</span>
                <span>পবিত্র মিহরাব প্রাঙ্গণ</span>
                <span>✦</span>
              </div>
            </div>

            {/* 6-Waqt Prayer Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
              {prayers.map((prayer) => {
                const isActive = activeWaqt === prayer.id;
                
                return (
                  <div
                    key={prayer.id}
                    className={`relative rounded-3xl p-5 acrylic-glass-card flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                      isActive
                        ? 'neon-active-waqt bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950/95 scale-[1.02] shadow-[0_0_40px_rgba(245,158,11,0.4)]'
                        : prayer.isFridaySpecial
                        ? 'border-emerald-400/45 bg-gradient-to-b from-emerald-500/15 via-slate-900/80 to-slate-950/90 hover:border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'hover:border-teal-400/45'
                    }`}
                  >
                    {/* Active Waqt Pulsing Badge */}
                    {isActive && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold tracking-wider uppercase animate-pulse shadow-[0_0_10px_#f59e0b]">
                        চলমান ওয়াক্ত
                      </div>
                    )}

                    {prayer.isFridaySpecial && !isActive && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                        সাপ্তাহিক জুমা
                      </div>
                    )}

                    {/* Card Top: Waqt Name & Arabic */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {prayer.nameBn}
                        </span>
                        <span className="font-arabic text-lg text-slate-400">
                          {prayer.nameAr}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {prayer.nameEn}
                      </span>
                    </div>

                    {/* Waqt-specific Live Sky/Sun/Moon Animation Container */}
                    <div className="my-5 flex items-center justify-center h-28 relative rounded-2xl bg-slate-950/60 border border-white/5 overflow-hidden">
                      
                      {/* FAJR ANIMATION */}
                      {prayer.iconType === 'fajr' && (
                        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-t from-amber-950/70 via-slate-900/50 to-cyan-950/40">
                          <div className="absolute bottom-4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
                          <div className="absolute bottom-2 w-12 h-12 rounded-full bg-amber-400 blur-sm opacity-90 shadow-[0_0_30px_#f59e0b]" />
                          <Sunrise className="w-10 h-10 text-amber-300 relative z-10 animate-float" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25)_0,transparent_70%)] animate-pulse" />
                        </div>
                      )}

                      {/* DHUHR ANIMATION */}
                      {prayer.iconType === 'dhuhr' && (
                        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-amber-500/15 via-cyan-500/10 to-transparent">
                          <div className="w-16 h-16 rounded-full border border-dashed border-amber-300/40 animate-spin-slow absolute" />
                          <Sun className="w-12 h-12 text-amber-300 relative z-10 animate-pulse shadow-[0_0_35px_#f59e0b]" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.3)_0,transparent_60%)]" />
                        </div>
                      )}

                      {/* ASR ANIMATION */}
                      {prayer.iconType === 'asr' && (
                        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-tr from-amber-900/40 via-slate-900 to-amber-700/25">
                          <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-amber-400/35 via-amber-500/10 to-transparent rotate-45 transform" />
                          <CloudSun className="w-10 h-10 text-amber-400 relative z-10 animate-float" />
                          <div className="absolute bottom-3 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                        </div>
                      )}

                      {/* MAGHRIB ANIMATION */}
                      {prayer.iconType === 'maghrib' && (
                        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-t from-purple-950/90 via-rose-950/50 to-slate-950">
                          <div className="absolute bottom-1 w-14 h-14 rounded-full bg-rose-500/75 blur-sm" />
                          <Sunset className="w-10 h-10 text-rose-300 relative z-10 animate-float" />
                          <div className="absolute bottom-4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent" />
                        </div>
                      )}

                      {/* ISHA ANIMATION */}
                      {prayer.iconType === 'isha' && (
                        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-950/70 via-slate-950 to-slate-950">
                          <div className="absolute top-2 left-3 w-1 h-1 rounded-full bg-teal-200 animate-twinkle" />
                          <div className="absolute top-5 right-5 w-1.5 h-1.5 rounded-full bg-amber-200 animate-twinkle" style={{ animationDelay: '1s' }} />
                          <div className="absolute bottom-4 left-6 w-1 h-1 rounded-full bg-cyan-200 animate-twinkle" style={{ animationDelay: '1.5s' }} />
                          <Moon className="w-10 h-10 text-cyan-300 relative z-10 shadow-[0_0_25px_rgba(45,212,191,0.5)] animate-float" />
                        </div>
                      )}

                      {/* JUMMAH ANIMATION */}
                      {prayer.iconType === 'jummah' && (
                        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-950/60 via-slate-900 to-teal-950/45">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/25 blur-md absolute animate-pulse" />
                          <svg className="w-10 h-10 text-emerald-300 relative z-10 shadow-[0_0_20px_#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v4" />
                            <path d="M12 2a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6a4 4 0 0 1 4-4z" />
                            <path d="M6 10h12" />
                            <path d="M6 16h12" />
                            <circle cx="12" cy="6" r="1" fill="#10b981" />
                          </svg>
                        </div>
                      )}

                    </div>

                    {/* Card Bottom: Azan & Jama'at Times */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">আজান:</span>
                        <span className="font-semibold text-teal-300 font-mono tracking-wide">
                          {formatTime12Bn(prayer.azan)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">জামাত:</span>
                        <span className="font-bold text-amber-300 font-mono tracking-wide text-sm">
                          {formatTime12Bn(prayer.jamaat)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 pt-1 leading-tight line-clamp-2">
                        {prayer.descriptionBn}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Bottom Mihrab Arch Footer */}
            <div className="mt-8 text-center pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <span className="text-teal-300 font-medium">★ বায়তুন নূর জামে মসজিদ কর্তৃপক্ষ কর্তৃক সময়সূচি অনুমোদিত</span>
              <span className="hidden sm:inline">·</span>
              <span>ইমাম ও মোয়াজ্জিন সাহেবের সাথে পরামর্শক্রমে জামাত সময় সমন্বিত</span>
            </div>

          </div>
        </section>

        {/* SECTION 2: Dynamic Sehri & Iftar Ramadan Countdown Showcase Banner */}
        <section id="ramadan-section" className="rounded-3xl p-6 sm:p-8 acrylic-glass border border-amber-400/40 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                <span>🌙</span>
                <span>রমজানুল মুবারক ও নফল রোজা সময়সূচী · লক্ষ্মীপুর</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                সেহরি ও ইফতারের <span className="neon-glow-gold text-amber-400">লাইভ কাউন্টডাউন</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                দালাল বাজার ও লক্ষ্মীপুর এলাকার সুনির্দিষ্ট সূর্যাস্ত ও সুবহে সাদিক অনুযায়ী সেহরি শেষ ও ইফতারের সময়।
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl acrylic-glass border border-amber-400/30">
                  <span className="text-[11px] text-slate-400 block">সেহরির শেষ সময়</span>
                  <span className="text-lg sm:text-xl font-extrabold text-amber-300 font-mono">
                    {sehriIftarData.sehriTime}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl acrylic-glass border border-teal-400/30">
                  <span className="text-[11px] text-slate-400 block">ইফতারের সময়</span>
                  <span className="text-lg sm:text-xl font-extrabold text-teal-300 font-mono">
                    {sehriIftarData.iftarTime}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl acrylic-glass border border-emerald-400/30 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 block">{sehriIftarData.label}</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-300 font-mono tabular-nums">
                    {sehriIftarData.countdownStr}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-center items-center text-center p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 to-slate-950/70 border border-amber-400/30">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl mb-3 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                🌙
              </div>
              <h3 className="text-base font-bold text-white">সেহরি ও ইফতার অ্যানিমেটেড পপআপ</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                সকালের সূর্যোদয় কুয়াশা ও সন্ধ্যার রক্তিম সূর্যাস্ত ভিউ
              </p>
              <button
                onClick={() => setRamadanModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all active:scale-95"
              >
                পূর্ণাঙ্গ সময়সূচি ও দোয়া দেখুন
              </button>
            </div>

          </div>
        </section>

        {/* SECTION 3: 7-Day Real-Time Weather Dashboard (Lakshmipur Live via Open-Meteo) */}
        <section id="weather-dashboard" className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full acrylic-glass border border-teal-400/30 text-teal-300 text-xs font-semibold">
                <CloudSun className="w-3.5 h-3.5 text-teal-400" />
                <span>ওপেন-মেটিও লাইভ স্যাটেলাইট আবহাওয়া ডাটাবেজ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                লক্ষ্মীপুর <span className="neon-glow-cyan text-teal-300">৭ দিনের রিয়েল-টাইম</span> আবহাওয়া
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                অক্ষাংশ: ২৩.০১৩৪° উত্তর | দ্রাঘিমাংশ: ৯০.৮৭১৫° পূর্ব (দালাল বাজার, লক্ষ্মীপুর)
              </p>
            </div>

            <button
              onClick={() => setWeatherModalOpen(true)}
              className="px-4 py-2 rounded-xl acrylic-glass border border-teal-400/30 text-teal-300 hover:border-teal-300 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>পূর্ণাঙ্গ অ্যানালিটিক্স পপআপ</span>
            </button>
          </div>

          {/* Current Live Overview Banner + 7-Day Forecast Grid */}
          <div className="rounded-3xl p-6 sm:p-8 acrylic-glass border border-teal-500/25 shadow-[0_0_45px_rgba(45,212,191,0.1)] space-y-6">
            
            {/* Real-Time Snapshot Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl acrylic-glass border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">বর্তমান তাপমাত্রা</span>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {weather ? `${toBn(weather.temp)}°C` : '২৭°C'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl acrylic-glass border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">বাতাসের আর্দ্রতা</span>
                  <span className="text-lg font-bold text-teal-200 font-mono tabular-nums">
                    {weather ? `${toBn(weather.humidity)}%` : '৬৫%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl acrylic-glass border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">বাতাসের গতি</span>
                  <span className="text-lg font-bold text-cyan-200 font-mono tabular-nums">
                    {weather ? `${toBn(weather.windSpeed)} কিমি/ঘণ্টা` : '৮ কিমি/ঘণ্টা'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl acrylic-glass border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                {/* Weather text without clipping bug */}
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 block">পরিবেশ অবস্থা</span>
                  <span className="text-xs font-semibold text-emerald-200 block break-words whitespace-normal leading-tight">
                    {weather ? weather.weatherDesc : 'পরিষ্কার আকাশ'}
                  </span>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
              {weatherLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl acrylic-glass border border-white/5 animate-pulse" />
                ))
              ) : (
                weather?.daily.map((day, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 acrylic-glass-card text-center flex flex-col justify-between ${
                      idx === 0 ? 'border-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.2)]' : ''
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-bold block ${idx === 0 ? 'text-teal-300' : 'text-slate-300'}`}>
                        {day.dayName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {toBn(day.date.split('-')[2])} নভে
                      </span>
                    </div>

                    {/* Sky Animated Weather Icon */}
                    <div className="my-3 flex items-center justify-center text-amber-300">
                      {day.rainProb > 40 ? (
                        <CloudRain className="w-8 h-8 text-cyan-400 animate-bounce" />
                      ) : day.weatherCode <= 1 ? (
                        <Sun className="w-8 h-8 text-amber-400 animate-spin-slow" />
                      ) : (
                        <CloudSun className="w-8 h-8 text-teal-300 animate-float" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold">
                        <span className="text-white">{toBn(day.maxTemp)}°</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">{toBn(day.minTemp)}°</span>
                      </div>
                      
                      {/* RAIN PERCENTAGE LABEL: Proper padding preventing '5' clipping on mobile */}
                      <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-400/30 text-[10px] text-cyan-200 font-semibold tracking-wide w-full min-w-0">
                        <Droplets className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span className="whitespace-nowrap font-mono">{toBn(day.rainProb)}% বৃষ্টি</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </section>

        {/* SECTION 4: Rotating Quranic Verses & Sahih Hadith Slider */}
        <section id="quran-hadith" className="space-y-4">
          
          <div className="text-center max-w-xl mx-auto space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full acrylic-glass border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>নূরে কুরআন ও হাদিসের প্রজ্ঞাময় বাণী</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              দৈনিক <span className="neon-glow-emerald text-emerald-300">আত্মিক পরিশুদ্ধি</span> ও অনুপ্রেরণা
            </h2>
          </div>

          <div className="relative rounded-3xl p-6 sm:p-10 acrylic-glass border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.12)] overflow-hidden">
            
            <div className="absolute right-6 -bottom-10 font-arabic text-8xl text-emerald-500/5 select-none pointer-events-none">
              نُورٌ عَلَىٰ نُورٍ
            </div>

            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-5">
              
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                {QURAN_VERSES[activeVerseIndex].category} · {QURAN_VERSES[activeVerseIndex].surah}
              </div>

              <p className="font-arabic text-2xl sm:text-3xl lg:text-4xl text-amber-200 leading-loose tracking-wide dir-rtl" style={{ direction: 'rtl' }}>
                {QURAN_VERSES[activeVerseIndex].arabic}
              </p>

              <p className="text-base sm:text-xl text-slate-100 font-medium leading-relaxed max-w-2xl mx-auto">
                "{QURAN_VERSES[activeVerseIndex].bengali}"
              </p>

              <div className="text-xs font-semibold text-emerald-300 tracking-wider">
                — {QURAN_VERSES[activeVerseIndex].reference}
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setActiveVerseIndex((prev) => (prev - 1 + QURAN_VERSES.length) % QURAN_VERSES.length)}
                  className="p-2.5 rounded-full acrylic-glass border border-white/10 text-slate-300 hover:text-white hover:border-emerald-400 transition-all"
                  aria-label="পূর্ববর্তী আয়াত"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1.5">
                  {QURAN_VERSES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveVerseIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === activeVerseIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-600'
                      }`}
                      aria-label={`আয়াত ${toBn(idx + 1)}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setActiveVerseIndex((prev) => (prev + 1) % QURAN_VERSES.length)}
                  className="p-2.5 rounded-full acrylic-glass border border-white/10 text-slate-300 hover:text-white hover:border-emerald-400 transition-all"
                  aria-label="পরবর্তী আয়াত"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 5: Mosque Information, Facilities & Community Info */}
        <section id="mosque-info" className="space-y-6">
          
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              মসজিদ পরিচিতি ও <span className="neon-glow-cyan text-teal-300">সেবাসমূহ</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              বাইতুন নূর জামে মসজিদ, কামন খোলা, দালাল বাজার, লক্ষ্মীপুর
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Facilities */}
            <div className="rounded-3xl p-6 acrylic-glass border border-teal-500/20 space-y-4">
              <div className="w-12 h-12 rounded-2xl acrylic-glass border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">মসজিদের বিশেষ সুবিধাসমূহ</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>আধুনিক সেন্ট্রাল এসি ও সার্বক্ষণিক ফ্যান ব্যবস্থা</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>প্রশস্ত পরিচ্ছন্ন ওজুখানা ও বিশুদ্ধ খাবার পানি</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>উচ্চক্ষমতাসম্পন্ন সৌরবিদ্যুৎ ও নিরবচ্ছিন্ন জেনারেটর</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>হিফজুল কুরআন বিভাগ ও বয়স্কদের দ্বীনি পাঠদান</span>
                </li>
              </ul>
            </div>

            {/* Jummah Highlights */}
            <div className="rounded-3xl p-6 acrylic-glass border border-emerald-500/25 space-y-4">
              <div className="w-12 h-12 rounded-2xl acrylic-glass border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">পবিত্র জুমার বিশেষ সময়সূচি</h3>
              <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">প্রথম আযান:</span>
                  <span className="font-semibold text-teal-300 font-mono">১২:০০ দুপুর</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">দ্বীনি বয়ান ও খুৎবা:</span>
                  <span className="font-semibold text-amber-300 font-mono">০১:০০ দুপুর</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">জুমা সালাত জামাত:</span>
                  <span className="font-bold text-emerald-300 font-mono">০১:৩০ দুপুর</span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  * জুমার দিনে আগেভাগে মসজিদে এসে তাহিয়্যাতুল মসজিদ আদায় করুন।
                </p>
              </div>
            </div>

            {/* Donations */}
            <div className="rounded-3xl p-6 acrylic-glass border border-amber-500/25 space-y-4">
              <div className="w-12 h-12 rounded-2xl acrylic-glass border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">মসজিদ ফান্ডে দান ও সদকা</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                মসজিদের উন্নয়ন, বিদ্যুৎ বিল ও ইমাম-মোয়াজ্জিনের সম্মানী ফান্ডে মুক্তহস্তে দান করে সাদকায়ে জারিয়ার অংশীদার হোন।
              </p>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 text-xs space-y-1">
                <div className="text-slate-400">বিকাশ / নগদ (পার্সোনাল):</div>
                <div className="text-base font-bold text-amber-300 font-mono tracking-wider flex items-center justify-between">
                  <span>০১৮০০-০০০০০০</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('01800000000');
                      showNotification('বিকাশ নম্বর কপি করা হয়েছে');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                  >
                    কপি করুন
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* =========================================================================
          FULL-SCREEN SEHRI & IFTAR RAMADAN MODAL (WITH DYNAMIC ANIMATIONS)
         ========================================================================= */}
      {ramadanModalOpen && (
        <div className="fixed inset-0 z-floating flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl">
          <div className="relative w-full max-w-2xl rounded-3xl acrylic-glass border border-amber-400/50 p-6 sm:p-8 shadow-[0_0_70px_rgba(245,158,11,0.35)] space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl acrylic-glass border border-amber-400/50 flex items-center justify-center text-amber-300 text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                  🌙
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">সেহরি ও ইফতারের সময়সূচি</h3>
                  <p className="text-xs text-amber-300/80">কামন খোলা, দালাল বাজার, লক্ষ্মীপুর</p>
                </div>
              </div>

              <button
                onClick={() => setRamadanModalOpen(false)}
                className="p-2 rounded-full acrylic-glass border border-white/10 text-slate-300 hover:text-white hover:border-amber-400 transition-all"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Switcher Tabs (Auto, Sehri View, Iftar View) */}
            <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-950/70 border border-white/10">
              <button
                onClick={() => setRamadanViewTab('auto')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  ramadanViewTab === 'auto'
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                লাইভ অটো ভিউ
              </button>
              <button
                onClick={() => setRamadanViewTab('sehri')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  ramadanViewTab === 'sehri'
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌅 সেহরি ভিউ (ভোর)
              </button>
              <button
                onClick={() => setRamadanViewTab('iftar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  ramadanViewTab === 'iftar'
                    ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌇 ইফতার ভিউ (সন্ধ্যা)
              </button>
            </div>

            {/* Time-Based Dynamic Animations: Sehri (Dawn mist & rising sun) or Iftar (Crimson sunset dip) */}
            <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 border border-white/10 flex items-center justify-center">
              
              {effectiveRamadanView === 'sehri' ? (
                /* SEHRI VIEW: Gradual soft rising of the golden morning sun breaking through dawn mist */
                <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-t from-amber-950/80 via-slate-900 to-cyan-950/50 p-4 overflow-hidden">
                  {/* Dawn mist clouds */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(245,158,11,0.3)_0,transparent_75%)] animate-pulse" />
                  
                  {/* Floating mist layers */}
                  <div className="absolute bottom-6 -left-10 -right-10 h-8 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent blur-md animate-dawn-mist" />
                  <div className="absolute bottom-2 -left-10 -right-10 h-6 bg-gradient-to-r from-transparent via-teal-200/20 to-transparent blur-md animate-dawn-mist" style={{ animationDelay: '2s' }} />
                  
                  {/* Horizon line */}
                  <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />
                  
                  {/* Rising Sun */}
                  <div className="relative z-10 flex flex-col items-center animate-sehri-sun">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 shadow-[0_0_40px_rgba(245,158,11,0.9)] flex items-center justify-center">
                      <Sunrise className="w-8 h-8 text-amber-950" />
                    </div>
                  </div>

                  <div className="relative z-20 text-center mt-3">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block">
                      সুবহে সাদিক ও সেহরি সমাপ্তি
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                      {sehriIftarData.sehriTime}
                    </span>
                  </div>
                </div>
              ) : (
                /* IFTAR VIEW: Mesmerizing crimson/purple sunset dipping below horizon */
                <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-t from-purple-950/90 via-rose-950/70 to-slate-950 p-4 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(244,63,94,0.35)_0,transparent_75%)]" />
                  
                  {/* Horizon line */}
                  <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent opacity-80" />
                  
                  {/* Dipping Sunset Sun */}
                  <div className="relative z-10 flex flex-col items-center animate-iftar-dip">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-rose-400 via-pink-500 to-purple-600 shadow-[0_0_45px_rgba(244,63,94,0.9)] flex items-center justify-center">
                      <Sunset className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="relative z-20 text-center mt-3">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-widest block">
                      সূর্যাস্ত ও ইফতারের শুভ মুহূর্ত
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                      {sehriIftarData.iftarTime}
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Countdown Banner */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-400/40 text-center">
              <span className="text-xs text-amber-300 block">{sehriIftarData.label}</span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums my-1 block">
                {sehriIftarData.countdownStr}
              </span>
              <span className="text-[11px] text-slate-400">
                দালাল বাজার, লক্ষ্মীপুর ভৌগোলিক সৌর সময় অনুযায়ী লাইভ হিসাব
              </span>
            </div>

            {/* Roza Niyyat & Iftar Dua in Bengali */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Roza Niyyat */}
              <div className="p-4 rounded-2xl acrylic-glass border border-amber-400/30 space-y-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>রোজার নিয়ত (উচ্চারণ ও অর্থ)</span>
                </span>
                <p className="font-arabic text-sm text-amber-200" style={{ direction: 'rtl' }}>
                  نَوَيْتُ اَنْ اُصُوْمَ غَدًا مِّنْ شَهْرِ رَمَضَانَ الْمُبَارَكِ
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <b>উচ্চারণ:</b> নাওয়াইতু আন আছুমা গাদাম মিন শাহরি রমাদানাল মুবারাক।
                </p>
                <p className="text-[10px] text-slate-400 italic">
                  <b>অর্থ:</b> আমি পবিত্র রমজান মাসের আগামীকালের রোজা রাখার নিয়ত করলাম।
                </p>
              </div>

              {/* Iftar Dua */}
              <div className="p-4 rounded-2xl acrylic-glass border border-teal-400/30 space-y-2">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>ইফতারের দোয়া (উচ্চারণ ও অর্থ)</span>
                </span>
                <p className="font-arabic text-sm text-teal-200" style={{ direction: 'rtl' }}>
                  اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <b>উচ্চারণ:</b> আল্লাহুম্মা লাকা ছুমতু ওয়া আলা রিযক্বিকা আফত্বারতু।
                </p>
                <p className="text-[10px] text-slate-400 italic">
                  <b>অর্থ:</b> হে আল্লাহ! আমি আপনার সন্তুষ্টির জন্য রোজা রেখেছি এবং আপনারই রিজিক দ্বারা ইফতার করলাম।
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* FULL-SCREEN LIQUID GLASS WEATHER POPUP MODAL */}
      {weatherModalOpen && (
        <div className="fixed inset-0 z-floating flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl">
          <div className="relative w-full max-w-3xl rounded-3xl acrylic-glass border border-teal-400/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(45,212,191,0.25)] space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl acrylic-glass border border-teal-400/50 flex items-center justify-center text-teal-300">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">লক্ষ্মীপুর লাইভ আবহাওয়া অ্যানালিটিক্স</h3>
                  <p className="text-xs text-teal-300/80">কামন খোলা, দালাল বাজার · অক্ষাংশ ২৩.০১৩৪°, দ্রাঘিমাংশ ৯০.৮৭১৫°</p>
                </div>
              </div>

              <button
                onClick={() => setWeatherModalOpen(false)}
                className="p-2 rounded-full acrylic-glass border border-white/10 text-slate-300 hover:text-white hover:border-teal-400 transition-all"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Condition Spotlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/20 to-slate-950/80 border border-teal-400/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-teal-200">বর্তমান অনুভূতি তাপমাত্রা</span>
                  <div className="text-4xl font-extrabold text-white font-mono my-1">
                    {weather ? `${toBn(weather.temp)}°C` : '২৭°C'}
                  </div>
                  <span className="text-xs text-slate-300">
                    অনুভূত হচ্ছে {weather ? `${toBn(weather.apparentTemp)}°C` : '২৮°C'}
                  </span>
                </div>
                <Sun className="w-16 h-16 text-amber-400 animate-spin-slow shrink-0" />
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-slate-950/80 border border-indigo-400/30 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-indigo-200">আকাশের সার্বিক অবস্থা</span>
                  <div className="text-base sm:text-lg font-bold text-white mt-1 break-words whitespace-normal leading-snug">
                    {weather?.weatherDesc || 'পরিষ্কার আকাশ'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
                  <span>আর্দ্রতা: <b className="text-teal-300">{weather ? toBn(weather.humidity) : '৬৫'}%</b></span>
                  <span>বাতাস: <b className="text-cyan-300">{weather ? toBn(weather.windSpeed) : '৮'} কিমি/ঘ</b></span>
                </div>
              </div>
            </div>

            {/* 7-Day Extended Table */}
            <div>
              <h4 className="text-sm font-bold text-teal-200 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>আসন্ন ৭ দিনের পূর্বাভাস তালিকা</span>
              </h4>

              <div className="space-y-2">
                {weather?.daily.map((day, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl acrylic-glass border border-white/5 hover:border-teal-400/30 transition-all text-xs"
                  >
                    <div className="w-24 font-semibold text-slate-200 shrink-0">
                      {day.dayName}
                    </div>
                    {/* Text wrap without clipping */}
                    <div className="text-slate-400 hidden sm:block flex-1 text-center px-2 break-words whitespace-normal">
                      {day.weatherDesc}
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-300 font-mono px-2 py-0.5 rounded bg-cyan-950/50 shrink-0">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>{toBn(day.rainProb)}%</span>
                    </div>
                    <div className="w-20 text-right font-mono font-bold text-white shrink-0">
                      <span>{toBn(day.maxTemp)}° / </span>
                      <span className="text-slate-400">{toBn(day.minTemp)}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prayer Comfort Advice */}
            <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/20 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>
                <b>মসজিদ গমন পরামর্শ:</b> বর্তমান আর্দ্রতা ও আবহাওয়া স্বাভাবিক রয়েছে। জামাতে অংশগ্রহণের জন্য ওজু করে মসজিদের পরিচ্ছন্ন পরিবেশে যথাসময়ে উপস্থিত হোন।
              </span>
            </div>

          </div>
        </div>
      )}

      {/* NEXT ADHAN QUICK MODAL */}
      {azanModalOpen && (
        <div className="fixed inset-0 z-floating flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl">
          <div className="relative w-full max-w-md rounded-3xl acrylic-glass border border-teal-400/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(45,212,191,0.25)] space-y-5 text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-base">
                <Bell className="w-4 h-4" />
                <span>পরবর্তী আযান সময়সূচি</span>
              </div>
              <button
                onClick={() => setAzanModalOpen(false)}
                className="p-1.5 rounded-full acrylic-glass border border-white/10 text-slate-300 hover:text-white"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <span className="text-xs uppercase tracking-widest text-teal-300 font-bold">
                আসন্ন ওয়াক্ত
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {nextWaqt.nameBn} ({nextWaqt.nameAr})
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                আজান: <b className="text-teal-300">{formatTime12Bn(nextWaqt.azan)}</b> · জামাত: <b className="text-amber-300">{formatTime12Bn(nextWaqt.jamaat)}</b>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-teal-400/30">
              <span className="text-xs text-slate-400 block">আজানের বাকি সময়</span>
              <span className="text-xl sm:text-2xl font-bold text-teal-200 font-mono tabular-nums block my-1">
                {countdownText}
              </span>
            </div>

            <button
              onClick={playAzanChime}
              className="w-full py-2.5 rounded-xl acrylic-glass border border-teal-400/40 text-teal-300 hover:border-teal-300 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              <span>আযান ধ্বনি টেস্ট শুনুন</span>
            </button>

          </div>
        </div>
      )}

      {/* DIGITAL TASBIH COUNTER MODAL */}
      {tasbihModalOpen && (
        <div className="fixed inset-0 z-floating flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl">
          <div className="relative w-full max-w-md rounded-3xl acrylic-glass border border-amber-400/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] space-y-6 text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
                <Heart className="w-4 h-4" />
                <span>ডিজিটাল তাসবীহ কাউন্টার</span>
              </div>
              <button
                onClick={() => setTasbihModalOpen(false)}
                className="p-1.5 rounded-full acrylic-glass border border-white/10 text-slate-300 hover:text-white"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dhikr Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {dhikrList.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTasbihDhikrIndex(idx);
                    setTasbihCount(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    idx === tasbihDhikrIndex
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'acrylic-glass text-slate-300 hover:text-white'
                  }`}
                >
                  {d.bn}
                </button>
              ))}
            </div>

            {/* Big Arabic Display */}
            <div className="py-2">
              <p className="font-arabic text-3xl sm:text-4xl text-amber-300 mb-1" style={{ direction: 'rtl' }}>
                {currentDhikr.text}
              </p>
              <p className="text-xs text-slate-300">
                {currentDhikr.meaning}
              </p>
            </div>

            {/* Interactive Big Click Target Button */}
            <div className="flex flex-col items-center justify-center py-2">
              <button
                onClick={handleTasbihClick}
                className="w-36 h-36 rounded-full acrylic-glass border-2 border-amber-400/60 shadow-[0_0_40px_rgba(245,158,11,0.35)] flex flex-col items-center justify-center text-white active:scale-95 transition-transform group cursor-pointer"
              >
                <span className="text-4xl sm:text-5xl font-black font-mono text-amber-300 group-hover:scale-110 transition-transform">
                  {toBn(tasbihCount)}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">
                  লক্ষ্য: {toBn(currentDhikr.target)}
                </span>
              </button>
            </div>

            {/* Reset & Switch Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setTasbihCount(0)}
                className="px-4 py-2 rounded-xl acrylic-glass border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 hover:border-amber-400/40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট করুন</span>
              </button>
              <button
                onClick={() => {
                  setTasbihDhikrIndex((prev) => (prev + 1) % dhikrList.length);
                  setTasbihCount(0);
                }}
                className="px-4 py-2 rounded-xl acrylic-glass border border-amber-400/30 text-xs font-semibold text-amber-300 hover:border-amber-400"
              >
                পরবর্তী জিকির
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QIBLA COMPASS MODAL */}
      {qiblaModalOpen && (
        <div className="fixed inset-0 z-floating flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl">
          <div className="relative w-full max-w-md rounded-3xl acrylic-glass border border-teal-400/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(45,212,191,0.25)] space-y-6 text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-base">
                <Compass className="w-4 h-4" />
                <span>ক্বিবলা দিক নির্দেশক (লক্ষ্মীপুর)</span>
              </div>
              <button
                onClick={() => setQiblaModalOpen(false)}
                className="p-1.5 rounded-full acrylic-glass border border-white/10 text-slate-300 hover:text-white"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compass Visualization */}
            <div className="py-4 flex justify-center">
              <div className="relative w-52 h-52 rounded-full acrylic-glass border-2 border-teal-400/40 shadow-[0_0_35px_rgba(45,212,191,0.25)] flex items-center justify-center">
                <span className="absolute top-2 text-[10px] font-bold text-slate-400">উত্তর (N)</span>
                <span className="absolute bottom-2 text-[10px] font-bold text-slate-400">দক্ষিণ (S)</span>
                <span className="absolute left-2 text-[10px] font-bold text-slate-400">পশ্চিম (W)</span>
                <span className="absolute right-2 text-[10px] font-bold text-slate-400">পূর্ব (E)</span>

                <div 
                  className="w-full h-full absolute inset-0 flex items-center justify-center transform"
                  style={{ transform: 'rotate(278deg)' }}
                >
                  <div className="w-1.5 h-20 bg-gradient-to-t from-transparent via-amber-400 to-amber-300 rounded-full shadow-[0_0_15px_#f59e0b] -translate-y-8" />
                  <div className="absolute top-3 w-4 h-4 text-amber-300 font-bold text-xs flex items-center justify-center">
                    🕋
                  </div>
                </div>

                <div className="w-4 h-4 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf] relative z-10" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold text-white">
                ক্বিবলার কোণ: <span className="text-amber-400 font-mono">২৭৮°</span> পশ্চিম-উত্তর-পশ্চিম
              </div>
              <p className="text-xs text-slate-400">
                পবিত্র কাবা শরীফ (মক্কা আল-মুকাররমা) অভিমুখী দিক। কামন খোলা, লক্ষ্মীপুর থেকে সরাসরি নির্দেশিত।
              </p>
            </div>

          </div>
        </div>
      )}

      {/* DEVELOPER FOOTER BRANDING (Section 7 Specification) */}
      <footer className="w-full mt-16 py-10 px-4 sm:px-8 acrylic-glass border-t border-teal-500/30 text-center relative z-20 shadow-[0_-10px_40px_rgba(45,212,191,0.1)]">
        <div className="max-w-4xl mx-auto space-y-4">
          
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <span>বাইতুন নূর জামে মসজিদ</span>
            <span>·</span>
            <span>কামন খোলা, দালাল বাজার, লক্ষ্মীপুর</span>
          </div>

          {/* REQUIRED DEVELOPER BRANDING SPECIFICATION:
              "Developed by Shariyar | All Rights Reserved © 2026-2027" 
              rendered in large, bold typography with high-intensity neon cyan glowing text-shadow.
          */}
          <div className="py-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide text-white neon-glow-cyan">
              Developed by Shariyar | All Rights Reserved © 2026-2027
            </h2>
          </div>

          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            আল্ট্রা-লাক্সারিয়াস অ্যাক্রিলিক লিকুইড গ্লাস ও নিওন লাইভ ইসলামিক ওয়েব প্ল্যাটফর্ম।
          </p>
        </div>
      </footer>

    </div>
  );
}
