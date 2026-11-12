export type GuideLanguage = 'en' | 'tl';

type GuideStep = {
  title: string;
  instruction: string;
};

type GuideSteps = readonly [
  GuideStep,
  GuideStep,
  GuideStep,
  GuideStep,
  GuideStep,
  GuideStep,
];

type GuideContent = {
  language: string;
  enrollmentGuide: string;
  close: string;
  reopen: string;
  mascotAlt: string;
  stepNavigation: string;
  previous: string;
  next: string;
  completion: string;
  step: string;
  of: string;
  steps: GuideSteps;
};

export const parentEnrollmentGuideContent: Record<GuideLanguage, GuideContent> =
  {
    en: {
      language: 'Language',
      enrollmentGuide: 'Enrollment guide',
      close: 'Minimize Kali guide',
      reopen: 'Reopen Kali enrollment guide',
      mascotAlt: 'Kali, the KalingaLink enrollment guide',
      stepNavigation: 'Kali guide steps',
      previous: 'Previous step',
      next: 'Next step',
      completion: 'Finish guide',
      step: 'Step',
      of: 'of',
      steps: [
        {
          title: 'Child Information',
          instruction:
            "Enter your child's complete name, birthdate, gender, and other personal details.",
        },
        {
          title: 'Health Information',
          instruction:
            "Provide your child's blood type, medical conditions, allergies, and immunization status.",
        },
        {
          title: 'Emergency Contact',
          instruction:
            'Enter the name, relationship, and contact number of your emergency contact.',
        },
        {
          title: 'Enrollment Placement',
          instruction:
            'Choose your preferred Child Development Center and enrollment type.',
        },
        {
          title: 'Required Documents',
          instruction:
            'Upload the required documents. Make sure each file is clear and follows the size limits.',
        },
        {
          title: 'Review & Submit',
          instruction:
            'Review all your details and documents before submitting your application.',
        },
      ],
    },
    tl: {
      language: 'Wika',
      enrollmentGuide: 'Gabay sa enrollment',
      close: 'I-minimize ang gabay ni Kali',
      reopen: 'Buksan muli ang gabay ni Kali sa enrollment',
      mascotAlt: 'Si Kali, ang gabay sa enrollment ng KalingaLink',
      stepNavigation: 'Mga hakbang sa gabay ni Kali',
      previous: 'Nakaraang hakbang',
      next: 'Susunod na hakbang',
      completion: 'Tapusin ang gabay',
      step: 'Hakbang',
      of: 'sa',
      steps: [
        {
          title: 'Impormasyon ng Bata',
          instruction:
            'Ilagay ang buong pangalan, kaarawan, kasarian, at iba pang personal na impormasyon ng iyong anak.',
        },
        {
          title: 'Impormasyon sa Kalusugan',
          instruction:
            'Ilagay ang blood type, kondisyon sa kalusugan, allergies, at immunization status ng iyong anak.',
        },
        {
          title: 'Emergency Contact',
          instruction:
            'Ilagay ang pangalan, relasyon, at contact number ng iyong emergency contact.',
        },
        {
          title: 'Enrollment Placement',
          instruction:
            'Piliin ang nais na Child Development Center at enrollment type.',
        },
        {
          title: 'Mga Kinakailangang Dokumento',
          instruction:
            'I-upload ang mga kinakailangang dokumento. Tiyaking malinaw ang bawat file at pasok sa size limit.',
        },
        {
          title: 'Suriin at Ipasa',
          instruction:
            'Suriing mabuti ang lahat ng impormasyon at dokumento bago isumite ang aplikasyon.',
        },
      ],
    },
  };
