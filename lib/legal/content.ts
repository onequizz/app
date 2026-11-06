import type { Locale } from "@/lib/i18n/config";
import type { LegalDoc } from "./config";

/**
 * Textes des pages légales. Variables remplacées à l'affichage (voir LEGAL_INFO) :
 * {publisher}, {contact}, {jurisdiction}, {host}, {hostAddress}, {hostUrl}.
 */
export interface LegalBlock {
  h: string;
  p?: string[];
  ul?: string[];
  /** Première ligne : en-têtes de colonnes. */
  table?: string[][];
}

export interface LegalText {
  title: string;
  intro: string;
  blocks: LegalBlock[];
}

const fr: Record<LegalDoc, LegalText> = {
  notice: {
    title: "Mentions légales",
    intro: "Informations sur l'éditeur et l'hébergeur de OneQuizz, et sur les sources des données utilisées.",
    blocks: [
      {
        h: "Éditeur",
        p: [
          "OneQuizz est édité par {publisher}.",
          "Directeur de la publication : {publisher}.",
          "Contact : {contact}.",
        ],
      },
      {
        h: "Hébergement",
        p: ["Le site est hébergé par {host}, {hostAddress} ({hostUrl})."],
      },
      {
        h: "Propriété intellectuelle",
        p: [
          "Le nom OneQuizz, son logo, son code et sa conception graphique sont protégés. Toute reproduction ou réutilisation sans autorisation préalable est interdite.",
          "Les données et contenus de tiers restent soumis à leurs propres licences, détaillées ci-dessous.",
        ],
      },
      {
        h: "Sources des données",
        ul: [
          "Frontières et tracés (pays, fleuves, lacs, montagnes, déserts, mers) : Natural Earth, domaine public.",
          "Noms, capitales, coordonnées, populations et mesures : Wikidata, licence CC0.",
          "Noms de pays traduits : projet world-countries, licence ODbL.",
          "Drapeaux : country-flag-icons, licence MIT.",
          "Résumés et images des fiches : Wikipédia et Wikimedia Commons, licence CC BY-SA 4.0 ou licence indiquée sur la page d'origine ; chaque fiche renvoie vers l'article source.",
        ],
      },
      {
        h: "Frontières et dénominations",
        p: [
          "Les frontières, noms de lieux et capitales sont présentés à des fins pédagogiques. Ils reflètent les sources utilisées et des choix éditoriaux de OneQuizz, et n'ont aucune valeur officielle.",
        ],
      },
    ],
  },
  terms: {
    title: "Conditions d'utilisation",
    intro: "En utilisant OneQuizz, vous acceptez les présentes conditions.",
    blocks: [
      {
        h: "1. Le service",
        p: [
          "OneQuizz est un jeu éducatif de géographie, gratuit et accessible sans création de compte : quiz sur carte, défi du jour, révision et atlas du monde.",
        ],
      },
      {
        h: "2. Accès",
        p: [
          "Le service est fourni « en l'état ». Nous faisons notre possible pour qu'il reste disponible, sans pouvoir le garantir : il peut être interrompu pour maintenance, évolution ou en cas de panne de l'hébergeur.",
        ],
      },
      {
        h: "3. Règles d'utilisation",
        p: ["OneQuizz est destiné à un usage personnel et non commercial. Il est interdit :"],
        ul: [
          "de perturber le fonctionnement du service ou de tenter d'en contourner la sécurité ;",
          "d'interroger le service de manière automatisée et massive (robots, aspiration de contenus), notamment les fiches ;",
          "de copier ou de revendre tout ou partie du service.",
        ],
      },
      {
        h: "4. Contenus",
        p: [
          "Les informations affichées (chiffres, fiches, tracés) sont fournies à titre indicatif ; leur exactitude et leur mise à jour ne sont pas garanties.",
          "Les liens vers des sites externes, dont Wikipédia, relèvent de la responsabilité de leurs éditeurs.",
        ],
      },
      {
        h: "5. Scores et statistiques",
        p: [
          "Vos scores, statistiques et réglages sont enregistrés uniquement sur votre appareil. Ils sont perdus si vous effacez les données de votre navigateur ou changez d'appareil ; ils ne peuvent pas être récupérés.",
        ],
      },
      {
        h: "6. Responsabilité",
        p: [
          "Dans les limites permises par la loi, l'éditeur ne saurait être tenu responsable des dommages résultant de l'utilisation du service ou de son indisponibilité.",
        ],
      },
      {
        h: "7. Modifications",
        p: [
          "Ces conditions peuvent évoluer. La date de dernière mise à jour figure en haut de cette page ; la version en ligne est celle qui s'applique.",
        ],
      },
      {
        h: "8. Droit applicable et contact",
        p: [
          "Ces conditions sont régies par le droit de {jurisdiction}. Pour toute question : {contact}.",
        ],
      },
    ],
  },
  privacy: {
    title: "Politique de confidentialité",
    intro:
      "OneQuizz fonctionne sans compte, sans publicité et sans outil de mesure d'audience. Vos données de jeu restent sur votre appareil.",
    blocks: [
      {
        h: "Responsable du traitement",
        p: ["{publisher} — {contact}."],
      },
      {
        h: "Données conservées sur votre appareil",
        p: [
          "Vos réglages, votre langue, vos scores, statistiques et votre carnet de révision sont enregistrés dans votre navigateur (voir la page Cookies). Ils ne nous sont pas transmis, à l'exception du cookie de langue, lu par le serveur pour afficher les pages dans votre langue.",
        ],
      },
      {
        h: "Données techniques",
        p: [
          "Comme tout site web, notre hébergeur ({host}) reçoit les informations techniques nécessaires pour vous répondre : adresse IP, date et heure, page demandée, type de navigateur. Elles sont conservées pour une durée limitée dans ses journaux, pour la sécurité et le bon fonctionnement du service, et ne sont jamais utilisées pour vous profiler.",
          "Base légale : l'intérêt légitime de l'éditeur à fournir un service fonctionnel et sécurisé.",
        ],
      },
      {
        h: "Wikipédia et Wikimedia",
        p: [
          "Les résumés des fiches sont récupérés par notre serveur : votre adresse IP n'est pas transmise à Wikipédia pour les obtenir.",
          "Les images des fiches sont en revanche chargées directement depuis les serveurs de la Wikimedia Foundation (upload.wikimedia.org), qui reçoit alors votre adresse IP selon sa propre politique de confidentialité. Il en va de même si vous suivez un lien vers Wikipédia.",
        ],
      },
      {
        h: "Transferts hors de l'Union européenne",
        p: [
          "Notre hébergeur est une société établie aux États-Unis. Les données techniques décrites ci-dessus peuvent donc être traitées hors de l'Union européenne, dans le cadre des garanties prévues par l'hébergeur.",
        ],
      },
      {
        h: "Vos droits",
        p: [
          "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition et de limitation. Écrivez-nous à {contact}. Vous pouvez aussi introduire une réclamation auprès de l'autorité de protection des données de votre pays (en France, la CNIL).",
          "Vos données de jeu étant stockées sur votre appareil, vous pouvez les effacer vous-même à tout moment depuis la page Cookies.",
        ],
      },
      {
        h: "Mineurs",
        p: [
          "Aucun compte n'est demandé et aucune donnée personnelle n'est collectée pour jouer : OneQuizz peut être utilisé par tous les âges.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookies et stockage local",
    intro:
      "OneQuizz utilise un seul cookie et le stockage local de votre navigateur, uniquement pour faire fonctionner le jeu. Aucun cookie publicitaire ni de mesure d'audience.",
    blocks: [
      {
        h: "Ce que nous enregistrons",
        table: [
          ["Nom", "Type", "Finalité", "Durée"],
          ["oq-locale", "Cookie", "Mémoriser la langue choisie", "1 an"],
          ["oq-settings", "Stockage local", "Réglages : thèmes de quiz, règles, son, thème clair ou sombre", "Jusqu'à effacement"],
          ["oq-stats", "Stockage local", "Scores, statistiques, défi du jour et carnet de révision", "Jusqu'à effacement"],
        ],
      },
      {
        h: "Pourquoi aucun bandeau de consentement",
        p: [
          "Ces éléments sont strictement nécessaires au service que vous demandez (mémoriser vos choix et votre progression). La réglementation (directive ePrivacy, lignes directrices de la CNIL) les dispense de consentement préalable.",
        ],
      },
      {
        h: "Services tiers",
        p: [
          "OneQuizz ne dépose aucun cookie tiers. Les images des fiches proviennent des serveurs de la Wikimedia Foundation, qui applique sa propre politique.",
        ],
      },
      {
        h: "Effacer vos données",
        p: [
          "Le bouton ci-dessous supprime le cookie et toutes les données de OneQuizz enregistrées dans ce navigateur. Vous pouvez aussi le faire depuis les réglages de votre navigateur.",
        ],
      },
    ],
  },
};

const en: Record<LegalDoc, LegalText> = {
  notice: {
    title: "Legal notice",
    intro: "Information about the publisher and host of OneQuizz, and about the data sources it uses.",
    blocks: [
      {
        h: "Publisher",
        p: ["OneQuizz is published by {publisher}.", "Publication director: {publisher}.", "Contact: {contact}."],
      },
      { h: "Hosting", p: ["The site is hosted by {host}, {hostAddress} ({hostUrl})."] },
      {
        h: "Intellectual property",
        p: [
          "The OneQuizz name, logo, code and design are protected. Any reproduction or reuse without prior permission is prohibited.",
          "Third-party data and content remain subject to their own licences, listed below.",
        ],
      },
      {
        h: "Data sources",
        ul: [
          "Borders and shapes (countries, rivers, lakes, mountains, deserts, seas): Natural Earth, public domain.",
          "Names, capitals, coordinates, populations and measurements: Wikidata, CC0 licence.",
          "Translated country names: world-countries project, ODbL licence.",
          "Flags: country-flag-icons, MIT licence.",
          "Fact card summaries and images: Wikipedia and Wikimedia Commons, CC BY-SA 4.0 or the licence stated on the source page; each card links to the source article.",
        ],
      },
      {
        h: "Borders and names",
        p: [
          "Borders, place names and capitals are shown for educational purposes. They reflect the sources used and editorial choices made by OneQuizz, and have no official standing.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of use",
    intro: "By using OneQuizz, you agree to these terms.",
    blocks: [
      {
        h: "1. The service",
        p: [
          "OneQuizz is a free educational geography game, available without an account: map quizzes, daily challenge, review and world atlas.",
        ],
      },
      {
        h: "2. Access",
        p: [
          "The service is provided “as is”. We do our best to keep it available but cannot guarantee it: it may be interrupted for maintenance, updates or if the host has an outage.",
        ],
      },
      {
        h: "3. Rules of use",
        p: ["OneQuizz is intended for personal, non-commercial use. You must not:"],
        ul: [
          "disrupt the service or attempt to bypass its security;",
          "query the service in an automated, large-scale way (bots, scraping), including the fact cards;",
          "copy or resell all or part of the service.",
        ],
      },
      {
        h: "4. Content",
        p: [
          "The information shown (figures, fact cards, shapes) is provided for information only; its accuracy and currency are not guaranteed.",
          "External sites linked from OneQuizz, including Wikipedia, are the responsibility of their publishers.",
        ],
      },
      {
        h: "5. Scores and statistics",
        p: [
          "Your scores, statistics and settings are stored only on your device. They are lost if you clear your browser data or change device, and cannot be recovered.",
        ],
      },
      {
        h: "6. Liability",
        p: [
          "To the extent permitted by law, the publisher cannot be held liable for damage resulting from the use or unavailability of the service.",
        ],
      },
      {
        h: "7. Changes",
        p: [
          "These terms may change. The date of the last update is shown at the top of this page; the online version is the one that applies.",
        ],
      },
      {
        h: "8. Governing law and contact",
        p: ["These terms are governed by the law of {jurisdiction}. For any question: {contact}."],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro: "OneQuizz works without accounts, ads or audience measurement. Your game data stays on your device.",
    blocks: [
      { h: "Data controller", p: ["{publisher} — {contact}."] },
      {
        h: "Data kept on your device",
        p: [
          "Your settings, language, scores, statistics and review notebook are stored in your browser (see the Cookies page). They are not sent to us, except the language cookie, which the server reads to show pages in your language.",
        ],
      },
      {
        h: "Technical data",
        p: [
          "Like any website, our host ({host}) receives the technical information needed to respond to you: IP address, date and time, requested page, browser type. It is kept for a limited time in its logs for security and to keep the service running, and is never used to profile you.",
          "Legal basis: the publisher's legitimate interest in providing a working, secure service.",
        ],
      },
      {
        h: "Wikipedia and Wikimedia",
        p: [
          "Fact card summaries are fetched by our server: your IP address is not sent to Wikipedia to get them.",
          "Fact card images, however, load directly from Wikimedia Foundation servers (upload.wikimedia.org), which then receive your IP address under their own privacy policy. The same applies if you follow a link to Wikipedia.",
        ],
      },
      {
        h: "Transfers outside the European Union",
        p: [
          "Our host is a company based in the United States. The technical data described above may therefore be processed outside the European Union, under the safeguards provided by the host.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "Under the GDPR, you have the right to access, rectify, erase, object to and restrict the processing of your data. Write to us at {contact}. You can also lodge a complaint with the data protection authority of your country.",
          "As your game data is stored on your device, you can erase it yourself at any time from the Cookies page.",
        ],
      },
      {
        h: "Children",
        p: ["No account is required and no personal data is collected to play: OneQuizz is suitable for all ages."],
      },
    ],
  },
  cookies: {
    title: "Cookies and local storage",
    intro:
      "OneQuizz uses a single cookie and your browser's local storage, only to make the game work. No advertising or analytics cookies.",
    blocks: [
      {
        h: "What we store",
        table: [
          ["Name", "Type", "Purpose", "Duration"],
          ["oq-locale", "Cookie", "Remember your chosen language", "1 year"],
          ["oq-settings", "Local storage", "Settings: quiz themes, rules, sound, light or dark theme", "Until deleted"],
          ["oq-stats", "Local storage", "Scores, statistics, daily challenge and review notebook", "Until deleted"],
        ],
      },
      {
        h: "Why there is no consent banner",
        p: [
          "These items are strictly necessary for the service you request (remembering your choices and progress). The rules (ePrivacy directive, data protection authority guidelines) exempt them from prior consent.",
        ],
      },
      {
        h: "Third-party services",
        p: [
          "OneQuizz sets no third-party cookies. Fact card images come from Wikimedia Foundation servers, which apply their own policy.",
        ],
      },
      {
        h: "Erase your data",
        p: [
          "The button below deletes the cookie and all OneQuizz data stored in this browser. You can also do this from your browser settings.",
        ],
      },
    ],
  },
};

const es: Record<LegalDoc, LegalText> = {
  notice: {
    title: "Aviso legal",
    intro: "Información sobre el editor y el alojamiento de OneQuizz, y sobre las fuentes de datos utilizadas.",
    blocks: [
      {
        h: "Editor",
        p: ["OneQuizz está editado por {publisher}.", "Director de la publicación: {publisher}.", "Contacto: {contact}."],
      },
      { h: "Alojamiento", p: ["El sitio está alojado por {host}, {hostAddress} ({hostUrl})."] },
      {
        h: "Propiedad intelectual",
        p: [
          "El nombre OneQuizz, su logotipo, su código y su diseño están protegidos. Queda prohibida cualquier reproducción o reutilización sin autorización previa.",
          "Los datos y contenidos de terceros siguen sujetos a sus propias licencias, indicadas a continuación.",
        ],
      },
      {
        h: "Fuentes de los datos",
        ul: [
          "Fronteras y trazados (países, ríos, lagos, montañas, desiertos, mares): Natural Earth, dominio público.",
          "Nombres, capitales, coordenadas, poblaciones y medidas: Wikidata, licencia CC0.",
          "Nombres de países traducidos: proyecto world-countries, licencia ODbL.",
          "Banderas: country-flag-icons, licencia MIT.",
          "Resúmenes e imágenes de las fichas: Wikipedia y Wikimedia Commons, licencia CC BY-SA 4.0 o la indicada en la página de origen; cada ficha enlaza con el artículo fuente.",
        ],
      },
      {
        h: "Fronteras y denominaciones",
        p: [
          "Las fronteras, los topónimos y las capitales se presentan con fines educativos. Reflejan las fuentes utilizadas y decisiones editoriales de OneQuizz, y no tienen valor oficial.",
        ],
      },
    ],
  },
  terms: {
    title: "Condiciones de uso",
    intro: "Al usar OneQuizz, aceptas estas condiciones.",
    blocks: [
      {
        h: "1. El servicio",
        p: [
          "OneQuizz es un juego educativo de geografía, gratuito y sin necesidad de cuenta: quiz en el mapa, desafío del día, repaso y atlas del mundo.",
        ],
      },
      {
        h: "2. Acceso",
        p: [
          "El servicio se ofrece «tal cual». Hacemos lo posible para que esté disponible, sin poder garantizarlo: puede interrumpirse por mantenimiento, mejoras o una avería del alojamiento.",
        ],
      },
      {
        h: "3. Normas de uso",
        p: ["OneQuizz está destinado a un uso personal y no comercial. Está prohibido:"],
        ul: [
          "perturbar el funcionamiento del servicio o intentar eludir su seguridad;",
          "consultar el servicio de forma automatizada y masiva (robots, extracción de contenidos), en particular las fichas;",
          "copiar o revender total o parcialmente el servicio.",
        ],
      },
      {
        h: "4. Contenidos",
        p: [
          "La información mostrada (cifras, fichas, trazados) es orientativa; no se garantiza su exactitud ni su actualización.",
          "Los enlaces a sitios externos, incluida Wikipedia, son responsabilidad de sus editores.",
        ],
      },
      {
        h: "5. Puntuaciones y estadísticas",
        p: [
          "Tus puntuaciones, estadísticas y ajustes se guardan solo en tu dispositivo. Se pierden si borras los datos del navegador o cambias de dispositivo, y no se pueden recuperar.",
        ],
      },
      {
        h: "6. Responsabilidad",
        p: [
          "En la medida permitida por la ley, el editor no será responsable de los daños derivados del uso del servicio o de su falta de disponibilidad.",
        ],
      },
      {
        h: "7. Cambios",
        p: [
          "Estas condiciones pueden cambiar. La fecha de la última actualización figura al principio de esta página; se aplica la versión publicada.",
        ],
      },
      {
        h: "8. Ley aplicable y contacto",
        p: ["Estas condiciones se rigen por la legislación de {jurisdiction}. Para cualquier consulta: {contact}."],
      },
    ],
  },
  privacy: {
    title: "Política de privacidad",
    intro:
      "OneQuizz funciona sin cuentas, sin publicidad y sin herramientas de medición de audiencia. Tus datos de juego se quedan en tu dispositivo.",
    blocks: [
      { h: "Responsable del tratamiento", p: ["{publisher} — {contact}."] },
      {
        h: "Datos guardados en tu dispositivo",
        p: [
          "Tus ajustes, tu idioma, tus puntuaciones, estadísticas y tu cuaderno de repaso se guardan en tu navegador (ver la página Cookies). No se nos envían, salvo la cookie de idioma, que el servidor lee para mostrar las páginas en tu idioma.",
        ],
      },
      {
        h: "Datos técnicos",
        p: [
          "Como cualquier sitio web, nuestro alojamiento ({host}) recibe la información técnica necesaria para responderte: dirección IP, fecha y hora, página solicitada, tipo de navegador. Se conserva durante un tiempo limitado en sus registros, por seguridad y para el buen funcionamiento del servicio, y nunca se usa para elaborar perfiles.",
          "Base jurídica: el interés legítimo del editor en ofrecer un servicio operativo y seguro.",
        ],
      },
      {
        h: "Wikipedia y Wikimedia",
        p: [
          "Los resúmenes de las fichas los obtiene nuestro servidor: tu dirección IP no se envía a Wikipedia para conseguirlos.",
          "En cambio, las imágenes de las fichas se cargan directamente desde los servidores de la Wikimedia Foundation (upload.wikimedia.org), que recibe entonces tu dirección IP según su propia política de privacidad. Lo mismo ocurre si sigues un enlace a Wikipedia.",
        ],
      },
      {
        h: "Transferencias fuera de la Unión Europea",
        p: [
          "Nuestro alojamiento es una empresa establecida en Estados Unidos. Los datos técnicos descritos pueden tratarse fuera de la Unión Europea, con las garantías previstas por el alojamiento.",
        ],
      },
      {
        h: "Tus derechos",
        p: [
          "Conforme al RGPD, tienes derecho de acceso, rectificación, supresión, oposición y limitación. Escríbenos a {contact}. También puedes presentar una reclamación ante la autoridad de protección de datos de tu país.",
          "Como tus datos de juego se guardan en tu dispositivo, puedes borrarlos tú mismo en cualquier momento desde la página Cookies.",
        ],
      },
      {
        h: "Menores",
        p: ["No se pide ninguna cuenta ni se recogen datos personales para jugar: OneQuizz es apto para todas las edades."],
      },
    ],
  },
  cookies: {
    title: "Cookies y almacenamiento local",
    intro:
      "OneQuizz usa una sola cookie y el almacenamiento local de tu navegador, solo para que el juego funcione. Ninguna cookie publicitaria ni de medición de audiencia.",
    blocks: [
      {
        h: "Lo que guardamos",
        table: [
          ["Nombre", "Tipo", "Finalidad", "Duración"],
          ["oq-locale", "Cookie", "Recordar el idioma elegido", "1 año"],
          ["oq-settings", "Almacenamiento local", "Ajustes: temas del quiz, reglas, sonido, tema claro u oscuro", "Hasta que se borre"],
          ["oq-stats", "Almacenamiento local", "Puntuaciones, estadísticas, desafío del día y cuaderno de repaso", "Hasta que se borre"],
        ],
      },
      {
        h: "Por qué no hay aviso de consentimiento",
        p: [
          "Estos elementos son estrictamente necesarios para el servicio que solicitas (recordar tus elecciones y tu progreso). La normativa (directiva ePrivacy, directrices de las autoridades de protección de datos) los exime de consentimiento previo.",
        ],
      },
      {
        h: "Servicios de terceros",
        p: [
          "OneQuizz no instala cookies de terceros. Las imágenes de las fichas proceden de los servidores de la Wikimedia Foundation, que aplica su propia política.",
        ],
      },
      {
        h: "Borrar tus datos",
        p: [
          "El botón de abajo elimina la cookie y todos los datos de OneQuizz guardados en este navegador. También puedes hacerlo desde los ajustes de tu navegador.",
        ],
      },
    ],
  },
};

const ar: Record<LegalDoc, LegalText> = {
  notice: {
    title: "الإشعار القانوني",
    intro: "معلومات عن ناشر OneQuizz والجهة المستضيفة له، وعن مصادر البيانات المستخدمة.",
    blocks: [
      {
        h: "الناشر",
        p: ["ينشر OneQuizz: {publisher}.", "مدير النشر: {publisher}.", "للتواصل: {contact}."],
      },
      { h: "الاستضافة", p: ["يستضيف الموقع: {host}، {hostAddress} ({hostUrl})."] },
      {
        h: "الملكية الفكرية",
        p: [
          "اسم OneQuizz وشعاره وشيفرته وتصميمه محمية. يُمنع أي نسخ أو إعادة استخدام دون إذن مسبق.",
          "تبقى بيانات الغير ومحتوياتهم خاضعة لتراخيصها الخاصة المذكورة أدناه.",
        ],
      },
      {
        h: "مصادر البيانات",
        ul: [
          "الحدود والمسارات (الدول، الأنهار، البحيرات، الجبال، الصحارى، البحار): Natural Earth، ملك عام.",
          "الأسماء والعواصم والإحداثيات وعدد السكان والقياسات: Wikidata، ترخيص CC0.",
          "أسماء الدول المترجمة: مشروع world-countries، ترخيص ODbL.",
          "الأعلام: country-flag-icons، ترخيص MIT.",
          "ملخصات البطاقات وصورها: ويكيبيديا وويكيميديا كومنز، ترخيص CC BY-SA 4.0 أو الترخيص المذكور في الصفحة الأصلية؛ وتحيل كل بطاقة إلى المقال المصدر.",
        ],
      },
      {
        h: "الحدود والتسميات",
        p: [
          "تُعرض الحدود وأسماء الأماكن والعواصم لأغراض تعليمية. وهي تعكس المصادر المستخدمة وخيارات تحريرية لـ OneQuizz، ولا تحمل أي صفة رسمية.",
        ],
      },
    ],
  },
  terms: {
    title: "شروط الاستخدام",
    intro: "باستخدامك OneQuizz فإنك توافق على هذه الشروط.",
    blocks: [
      {
        h: "1. الخدمة",
        p: [
          "OneQuizz لعبة تعليمية في الجغرافيا، مجانية ومتاحة دون إنشاء حساب: اختبارات على الخريطة، تحدي اليوم، المراجعة وأطلس العالم.",
        ],
      },
      {
        h: "2. الوصول",
        p: [
          "تُقدَّم الخدمة «كما هي». نبذل جهدنا لإبقائها متاحة دون أن نضمن ذلك: قد تتوقف للصيانة أو التطوير أو عند حدوث عطل لدى جهة الاستضافة.",
        ],
      },
      {
        h: "3. قواعد الاستخدام",
        p: ["OneQuizz مخصص للاستخدام الشخصي غير التجاري. ويُمنع:"],
        ul: [
          "تعطيل عمل الخدمة أو محاولة تجاوز حمايتها؛",
          "استعلام الخدمة بطريقة آلية ومكثفة (روبوتات، سحب المحتوى)، ولا سيما البطاقات؛",
          "نسخ الخدمة أو بيعها كليًا أو جزئيًا.",
        ],
      },
      {
        h: "4. المحتوى",
        p: [
          "المعلومات المعروضة (أرقام، بطاقات، مسارات) إرشادية؛ ولا نضمن دقتها أو تحديثها.",
          "الروابط إلى مواقع خارجية، ومنها ويكيبيديا، تقع مسؤوليتها على ناشريها.",
        ],
      },
      {
        h: "5. النتائج والإحصائيات",
        p: [
          "تُحفظ نتائجك وإحصائياتك وإعداداتك على جهازك فقط. وتضيع إذا مسحت بيانات المتصفح أو غيّرت جهازك، ولا يمكن استرجاعها.",
        ],
      },
      {
        h: "6. المسؤولية",
        p: [
          "في الحدود التي يسمح بها القانون، لا يتحمل الناشر مسؤولية الأضرار الناتجة عن استخدام الخدمة أو عدم توفرها.",
        ],
      },
      {
        h: "7. التعديلات",
        p: ["قد تتغير هذه الشروط. يظهر تاريخ آخر تحديث أعلى هذه الصفحة، والنسخة المنشورة هي المعمول بها."],
      },
      {
        h: "8. القانون المطبق والتواصل",
        p: ["تخضع هذه الشروط لقانون {jurisdiction}. لأي سؤال: {contact}."],
      },
    ],
  },
  privacy: {
    title: "سياسة الخصوصية",
    intro: "يعمل OneQuizz دون حسابات ودون إعلانات ودون أدوات لقياس الجمهور. تبقى بيانات لعبك على جهازك.",
    blocks: [
      { h: "المسؤول عن المعالجة", p: ["{publisher} — {contact}."] },
      {
        h: "البيانات المحفوظة على جهازك",
        p: [
          "تُحفظ إعداداتك ولغتك ونتائجك وإحصائياتك ودفتر مراجعتك في متصفحك (انظر صفحة ملفات تعريف الارتباط). لا تُرسل إلينا، باستثناء ملف تعريف ارتباط اللغة الذي يقرؤه الخادم لعرض الصفحات بلغتك.",
        ],
      },
      {
        h: "البيانات التقنية",
        p: [
          "كأي موقع ويب، تتلقى جهة الاستضافة ({host}) المعلومات التقنية اللازمة للرد عليك: عنوان IP، التاريخ والوقت، الصفحة المطلوبة، نوع المتصفح. تُحفظ لمدة محدودة في سجلاتها لأغراض الأمان وحسن سير الخدمة، ولا تُستخدم أبدًا لتكوين ملف عنك.",
          "الأساس القانوني: المصلحة المشروعة للناشر في تقديم خدمة تعمل بشكل سليم وآمن.",
        ],
      },
      {
        h: "ويكيبيديا وويكيميديا",
        p: [
          "يجلب خادمنا ملخصات البطاقات: لا يُرسل عنوان IP الخاص بك إلى ويكيبيديا للحصول عليها.",
          "أما صور البطاقات فتُحمَّل مباشرة من خوادم مؤسسة ويكيميديا (upload.wikimedia.org)، التي تتلقى حينها عنوان IP الخاص بك وفق سياسة الخصوصية الخاصة بها. وينطبق الأمر نفسه إذا اتبعت رابطًا إلى ويكيبيديا.",
        ],
      },
      {
        h: "النقل خارج الاتحاد الأوروبي",
        p: [
          "جهة الاستضافة شركة مقرها الولايات المتحدة. لذا قد تُعالج البيانات التقنية المذكورة خارج الاتحاد الأوروبي، في إطار الضمانات التي توفرها جهة الاستضافة.",
        ],
      },
      {
        h: "حقوقك",
        p: [
          "وفقًا للائحة العامة لحماية البيانات، لك حق الوصول والتصحيح والمحو والاعتراض والتقييد. راسلنا على {contact}. ويمكنك أيضًا تقديم شكوى إلى هيئة حماية البيانات في بلدك.",
          "بما أن بيانات لعبك محفوظة على جهازك، يمكنك محوها بنفسك في أي وقت من صفحة ملفات تعريف الارتباط.",
        ],
      },
      {
        h: "القاصرون",
        p: ["لا يُطلب أي حساب ولا تُجمع أي بيانات شخصية للعب: OneQuizz مناسب لجميع الأعمار."],
      },
    ],
  },
  cookies: {
    title: "ملفات تعريف الارتباط والتخزين المحلي",
    intro:
      "يستخدم OneQuizz ملف تعريف ارتباط واحدًا والتخزين المحلي لمتصفحك، فقط لتشغيل اللعبة. لا ملفات إعلانية ولا لقياس الجمهور.",
    blocks: [
      {
        h: "ما نحفظه",
        table: [
          ["الاسم", "النوع", "الغرض", "المدة"],
          ["oq-locale", "ملف تعريف ارتباط", "تذكّر اللغة المختارة", "سنة واحدة"],
          ["oq-settings", "تخزين محلي", "الإعدادات: مواضيع الاختبار، القواعد، الصوت، المظهر الفاتح أو الداكن", "حتى المحو"],
          ["oq-stats", "تخزين محلي", "النتائج والإحصائيات وتحدي اليوم ودفتر المراجعة", "حتى المحو"],
        ],
      },
      {
        h: "لماذا لا يوجد شريط موافقة",
        p: [
          "هذه العناصر ضرورية حصرًا للخدمة التي تطلبها (تذكّر اختياراتك وتقدمك). والأنظمة (توجيه الخصوصية الإلكترونية وإرشادات هيئات حماية البيانات) تعفيها من الموافقة المسبقة.",
        ],
      },
      {
        h: "خدمات الغير",
        p: [
          "لا يضع OneQuizz أي ملف تعريف ارتباط تابع للغير. تأتي صور البطاقات من خوادم مؤسسة ويكيميديا التي تطبق سياستها الخاصة.",
        ],
      },
      {
        h: "محو بياناتك",
        p: [
          "يحذف الزر أدناه ملف تعريف الارتباط وجميع بيانات OneQuizz المحفوظة في هذا المتصفح. ويمكنك فعل ذلك أيضًا من إعدادات متصفحك.",
        ],
      },
    ],
  },
};

export const LEGAL_CONTENT: Record<Locale, Record<LegalDoc, LegalText>> = { fr, en, es, ar };
