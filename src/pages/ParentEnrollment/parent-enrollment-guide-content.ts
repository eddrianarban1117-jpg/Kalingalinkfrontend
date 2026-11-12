export type GuideLanguage = 'en' | 'tl';

type GuideContent = {
  welcome: string;
  start: string;
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
  stepTitles: [string, string, string, string, string, string];
  instructions: [string, string, string, string, string, string];
};

export const parentEnrollmentGuideContent: Record<GuideLanguage, GuideContent> =
  {
    en: {
      welcome:
        "Hi! I'm Kali! I'm here to help you with your child's enrollment. I'll guide you through each step to make the application process easier and simpler!",
      start: "Let's Get Started",
      language: 'Language',
      enrollmentGuide: 'Enrollment guide',
      close: 'Minimize Kali guide',
      reopen: 'Reopen Kali enrollment guide',
      mascotAlt: 'Kali, the KalingaLink enrollment guide',
      stepNavigation: 'Kali guide steps',
      previous: 'Previous',
      next: 'Next',
      completion: 'Got It!',
      step: 'Step',
      stepTitles: [
        'Child Information',
        'Health Information',
        'Emergency Contact',
        'Enrollment Placement',
        'Required Documents',
        'Review & Submit',
      ],
      instructions: [
        "Let's start with your child's basic information. Enter your child's complete name, nickname, birthdate, gender, PSA Birth Certificate Number, nationality, place of birth, and residential address. Make sure all details are accurate and match the supporting documents.",
        "Next, provide your child's health information. Indicate the blood type, any existing medical conditions, known allergies, and immunization status. Please provide accurate information to help the Child Development Center understand your child's health needs.",
        "Provide the contact information of the person who can be reached in case of an emergency. Enter the contact person's complete name, relationship to your child, and active contact number. Make sure the information is correct and accessible.",
        'Choose the appropriate Child Development Center and enrollment type for your child. Review your selection carefully before proceeding to the next part of the application.',
        'Prepare and upload the required supporting documents. These include the PSA Birth Certificate, Parent/Guardian Valid ID, recent 2x2 Parent/Guardian ID Picture, Barangay Clearance, and Proof of Residence. A Medical Certificate may also be required when applicable.\n\nFollow the file formats and size limits displayed in the enrollment form. Make sure your uploaded files are clear and readable.',
        "You're almost done! Carefully review all the information and documents you provided in your enrollment application. Once you are satisfied that everything is accurate and complete, use the existing Submit control on the enrollment form to send your application.\n\nThank you for choosing KalingaLink!",
      ],
    },
    tl: {
      welcome:
        'Kumusta! Ako si Kali! Nandito ako para tulungan ka sa pag-enroll ng iyong anak. Gagabayan kita sa bawat hakbang upang maging mas madali at simple ang proseso ng iyong aplikasyon!',
      start: 'Magsimula Na Tayo',
      language: 'Wika',
      enrollmentGuide: 'Gabay sa enrollment',
      close: 'I-minimize ang gabay ni Kali',
      reopen: 'Buksan muli ang gabay ni Kali sa enrollment',
      mascotAlt: 'Si Kali, ang gabay sa enrollment ng KalingaLink',
      stepNavigation: 'Mga hakbang sa gabay ni Kali',
      previous: 'Nakaraan',
      next: 'Susunod',
      completion: 'Naiintindihan Ko!',
      step: 'Hakbang',
      stepTitles: [
        'Impormasyon ng Bata',
        'Impormasyon sa Kalusugan',
        'Contact sa Emergency',
        'Pagpili ng CDC at Uri ng Enrollment',
        'Mga Kinakailangang Dokumento',
        'Suriin at Ipasa',
      ],
      instructions: [
        'Magsimula tayo sa pangunahing impormasyon ng iyong anak. Ilagay ang buong pangalan, palayaw, petsa ng kapanganakan, kasarian, PSA Birth Certificate Number, nasyonalidad, lugar ng kapanganakan, at tirahan ng iyong anak. Siguraduhing tama ang lahat ng impormasyong ilalagay.',
        'Sunod, ilagay ang impormasyon tungkol sa kalusugan ng iyong anak. Tukuyin ang blood type, anumang kasalukuyang kondisyong medikal, mga allergy, at immunization status. Siguraduhing tama ang mga impormasyong ibibigay upang malaman ng Child Development Center ang pangangailangan ng iyong anak.',
        'Ilagay ang impormasyon ng taong maaaring tawagan sakaling magkaroon ng emergency. Isulat ang buong pangalan ng contact person, relasyon niya sa iyong anak, at aktibong contact number. Siguraduhing tama at maaari siyang makontak.',
        'Piliin ang angkop na Child Development Center at enrollment type para sa iyong anak. Suriing mabuti ang iyong napili bago magpatuloy sa susunod na bahagi ng aplikasyon.',
        'Ihanda at i-upload ang mga kinakailangang dokumento. Kabilang dito ang PSA Birth Certificate, Valid ID ng Magulang o Guardian, bagong 2x2 ID Picture ng Magulang o Guardian, Barangay Clearance, at Proof of Residence. Maaari ring kailanganin ang Medical Certificate kung naaangkop.\n\nSundin ang mga file format at size limit na nakasaad sa enrollment form. Siguraduhing malinaw at nababasa ang mga dokumentong ia-upload.',
        'Malapit ka nang matapos! Suriing mabuti ang lahat ng impormasyong inilagay at mga dokumentong in-upload mo sa enrollment application. Kapag sigurado ka nang tama at kumpleto ang lahat, gamitin ang kasalukuyang Submit button sa enrollment form upang maipadala ang iyong aplikasyon.\n\nMaraming salamat sa pagpili sa KalingaLink!',
      ],
    },
  };
