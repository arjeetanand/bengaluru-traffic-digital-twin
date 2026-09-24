export interface GrowthCompany {
  name: string;
  website?: string;
  sourceUrl: string;
  linkedin?: string;
  logoUrl?: string;
}

export const quoteAtlasCsvCell = (value: string) => `"${(/^[\s]*[=+\-@]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;

export interface GrowthPark {
  id: string;
  name: string;
  area: string;
  googlePlaceId: string;
  lat?: number;
  lng?: number;
  mapCoverage: 'corridor' | 'context';
  description: string;
  painHypothesis: string;
  seoQuery: string;
  leadAngle: string;
  sourceUrl: string;
  featuredCompanies: GrowthCompany[];
}

const prestigeSource = 'https://bsmedia.business-standard.com/_media/bs/data/announcements/bse/14112025/9501fc65-6028-42cf-ba97-4567ddb2d1e8.pdf';
const capgeminiSource = 'https://www.capgemini.com/in-en/careers/lets-connect/our-offices/capgemini-bengaluru/';
const bagmaneSource = 'https://www.bagmanegroup.com/portfolio/world-technology-centre';
const anantaSource = 'https://blog.google/intl/en-in/company-news/welcome-to-ananta-google-indias-new-campus-in-bengaluru/';

export const GROWTH_PARKS: GrowthPark[] = [
  {
    id: 'prestige_tech_park',
    name: 'Prestige Tech Park',
    area: 'Kadubeesanahalli, Marathahalli–Sarjapur Outer Ring Road',
    googlePlaceId: 'ChIJ7-Cgk7MTrjsRpYr_lkVDiM8',
    // Approximate OSM feature centre from bellandur-marathahalli-corridor.json.
    lat: 12.9422614,
    lng: 77.6928369,
    mapCoverage: 'corridor',
    description: 'Map workplace mobility demand around Prestige Tech Park and find occupiers to approach with a focused commute offer.',
    painHypothesis: 'Hypothesis: peak-hour congestion and dispersed entrances make employee pickup planning difficult.',
    seoQuery: 'corporate shuttle Prestige Tech Park Kadubeesanahalli',
    leadAngle: 'Approach occupier workplace teams with an entrance-aware employee shuttle proposal; verify their routes and current needs first.',
    sourceUrl: prestigeSource,
    featuredCompanies: [
      { name: 'Juniper Networks', website: 'https://www.juniper.net/', sourceUrl: prestigeSource, linkedin: 'https://www.linkedin.com/company/juniper-networks/' },
      { name: 'JPMorganChase', website: 'https://www.jpmorganchase.com/', sourceUrl: prestigeSource, linkedin: 'https://www.linkedin.com/company/jpmorganchase/' },
      { name: 'Oracle', website: 'https://www.oracle.com/', sourceUrl: prestigeSource, linkedin: 'https://www.linkedin.com/company/oracle/' },
      { name: '[24]7.ai', website: 'https://www.247.ai/', sourceUrl: prestigeSource, linkedin: 'https://www.linkedin.com/company/24-7-ai/' },
      { name: 'Guidewire', website: 'https://www.guidewire.com/', sourceUrl: 'https://www.guidewire.com/about/press-center/press-releases/20250916/guidewire-celebrates-expansion-in-india-with-new-bengaluru-office', linkedin: 'https://www.linkedin.com/company/guidewire-software/' },
      { name: 'Amadeus', website: 'https://amadeus.com/', sourceUrl: 'https://corporate.amadeus.com/documents/en/investors/2025/cnmv/q1/fy2024-individual-accounts-cnmv.pdf', linkedin: 'https://www.linkedin.com/company/amadeus/' },
      { name: 'Capgemini', website: 'https://www.capgemini.com/', sourceUrl: 'https://www.capgemini.com/in-en/about-us/locations/', linkedin: 'https://www.linkedin.com/company/capgemini/' },
      { name: 'CoinSwitch', website: 'https://coinswitch.co/', sourceUrl: 'https://creatorlabs.coinswitch.co/privacy', linkedin: 'https://www.linkedin.com/company/coinswitch/' },
      { name: 'Adobe', website: 'https://www.adobe.com/', sourceUrl: 'https://www.adobe.com/about-adobe/contact/offices.html', linkedin: 'https://www.linkedin.com/company/adobe/' },
      { name: 'BlackLine', website: 'https://www.blackline.com/', sourceUrl: 'https://investors.blackline.com/corporate-profile', linkedin: 'https://www.linkedin.com/company/blackline/' },
      { name: 'Sandhata Technologies', website: 'https://sandhata.com/', sourceUrl: 'https://sandhata.com/contact-us/', linkedin: 'https://www.linkedin.com/company/sandhata-technologies-limited' },
      { name: 'WeWork India (Jupiter)', website: 'https://wework.co.in/', sourceUrl: 'https://wework.co.in/office-space/bangalore/marathahalli/jupiter-prestige-tech-park/', linkedin: 'https://www.linkedin.com/company/wework-india/' },
      { name: 'KnowBe4', website: 'https://www.knowbe4.com/', sourceUrl: 'https://www.knowbe4.com/careers/blogs/culture/new-bangalore-office-2025', linkedin: 'https://www.linkedin.com/company/knowbe4' },
      { name: 'Tredence', website: 'https://www.tredence.com/', sourceUrl: 'https://www.tredence.com/contact-us', linkedin: 'https://www.linkedin.com/company/tredence/' },
      { name: 'Nexusnow.ai', website: 'https://www.nexusnow.ai/', sourceUrl: 'https://www.linkedin.com/posts/nexusnow-ai_nexusnowai-officeinauguration-newbeginnings-activity-7466126562405449728-NXqz', linkedin: 'https://www.linkedin.com/company/nexusnow-ai' },
      { name: 'Sodexo', website: 'https://www.sodexo.com/', sourceUrl: 'https://www.linkedin.com/posts/sodexo_sodexoindia-bengaluru-officelaunch-activity-7420411897704972288-oD10', linkedin: 'https://www.linkedin.com/company/sodexo/' },
      { name: 'Altair', website: 'https://altair.com/', sourceUrl: 'https://www.linkedin.com/posts/altair-engineering_teamaltair-onlyforward-activity-7282600397624483840-O0ce', linkedin: 'https://www.linkedin.com/company/altair-engineering/' },
      { name: 'DataSutram.ai', website: 'https://www.datasutram.ai/', sourceUrl: 'https://www.linkedin.com/posts/datasutram_datasutram-newoffice-bengaluru-activity-7400084961992560640-9SrZ', linkedin: 'https://www.linkedin.com/company/datasutram/' },
      { name: 'Khyath Tech', sourceUrl: 'https://in.linkedin.com/company/khyath-tech', linkedin: 'https://in.linkedin.com/company/khyath-tech' },
      { name: 'Innov8 (Platina 2)', website: 'https://www.innov8.work/', sourceUrl: 'https://www.linkedin.com/posts/innov8-workspaces_innov8-prestige-launch-activity-7320074005896380416-WYsC', linkedin: 'https://www.linkedin.com/company/innov8-workspaces/' },
      { name: 'Awfis', website: 'https://www.awfis.com/', sourceUrl: 'https://www.linkedin.com/posts/awfis_awfis-coworking-activity-7165306621655556096-GAUc', linkedin: 'https://www.linkedin.com/company/awfis/' }
    ]
  },
  {
    id: 'rmz_ecospace',
    name: 'RMZ Ecospace',
    area: 'Bellandur, Sarjapur Outer Ring Road',
    googlePlaceId: 'ChIJYeuQoKATrjsRRurpuUR0KP4',
    // Approximate OSM feature centre from bellandur-marathahalli-corridor.json.
    lat: 12.9241373,
    lng: 77.6805212,
    mapCoverage: 'context',
    description: 'Turn the Bellandur office cluster into a workplace mobility prospect list with location-specific search intent.',
    painHypothesis: 'Hypothesis: workers and visitors may find the right campus entrance or shuttle pickup point hard to identify.',
    seoQuery: 'office shuttle RMZ Ecospace Bellandur',
    leadAngle: 'Approach occupier facilities teams with a clear pickup-point and last-mile shuttle concept; confirm actual demand before pitching.',
    sourceUrl: 'https://www.brookfieldindiareit.in/files/stock-exchange-filing/Intimation_of_Pro_forma_financials__4dec2025.pdf',
    featuredCompanies: [
      { name: 'Capgemini', website: 'https://www.capgemini.com/', sourceUrl: capgeminiSource, linkedin: 'https://www.linkedin.com/company/capgemini/' },
      { name: 'Northern Trust', website: 'https://www.northerntrust.com/', sourceUrl: 'https://www.northerntrust.com/content/dam/northerntrust/corporate/global/en/documents/web/legal-privacy/binding-corporate-rules/binding-corporate-rules-controller.pdf', linkedin: 'https://www.linkedin.com/company/northern-trust/' },
      { name: 'Microland', website: 'https://www.microland.com/', sourceUrl: 'https://www.microland.com/contact', linkedin: 'https://www.linkedin.com/company/microland/' },
      { name: 'EY', website: 'https://www.ey.com/', sourceUrl: 'https://www.ey.com/content/dam/ey-unified-site/ey-com/en-in/technical/alerts-hub/documents/2026/03/kerala-hc-holds-banks-eligibility-of-50pc-itc-cannot-be-denied-where-it.pdf', linkedin: 'https://www.linkedin.com/company/ernstandyoung/' },
      { name: 'BDO RISE', website: 'https://www.bdo.com/careers/bdo-rise', sourceUrl: 'https://www.bdo.com/careers/bdo-rise', linkedin: 'https://www.linkedin.com/company/bdo-rise-private-limited' },
      { name: 'COWRKS (Ecospace 3B)', website: 'https://www.cowrks.com/', sourceUrl: 'https://www.cowrks.com/coworking-space-bengaluru/cowrks-ecospace-3b', linkedin: 'https://www.linkedin.com/company/cowrks/' },
      { name: 'Deloitte', website: 'https://www.deloitte.com/', sourceUrl: 'https://www.deloitte.com/in/en/offices/bengaluru-ecospace.html', linkedin: 'https://www.linkedin.com/company/deloitte' },
      { name: 'Synaptics', website: 'https://www.synaptics.com/', sourceUrl: 'https://www.synaptics.com/contact', linkedin: 'https://www.linkedin.com/company/synaptics' }
    ]
  },
  {
    id: 'bagmane_world_technology_centre',
    name: 'Bagmane World Technology Centre',
    area: 'Garudachar Palya, Mahadevapura',
    googlePlaceId: 'ChIJNdZMZXcRrjsRtjpyISavKB4',
    // Approximate OSM commercial-way centre: https://www.openstreetmap.org/way/91237236.
    lat: 12.9843034,
    lng: 77.6946207,
    mapCoverage: 'corridor',
    description: 'Use the verified occupier mix to plan employee transport outreach across the Mahadevapura employment cluster.',
    painHypothesis: 'Hypothesis: first-time visitors may need clearer last-mile directions to individual campus buildings.',
    seoQuery: 'employee transport Bagmane World Technology Centre Mahadevapura',
    leadAngle: 'Prioritize occupier workplace teams that may need building-specific pickup directions and employee shuttle coverage.',
    sourceUrl: bagmaneSource,
    featuredCompanies: [
      { name: 'Google', website: 'https://about.google/', sourceUrl: bagmaneSource, linkedin: 'https://www.linkedin.com/company/google/', logoUrl: 'https://www.bagmanegroup.com/media/filer_public/7c/b1/7cb1d250-d355-4625-af5b-6df328155e54/google.png' },
      { name: 'NVIDIA', website: 'https://www.nvidia.com/', sourceUrl: bagmaneSource, linkedin: 'https://www.linkedin.com/company/nvidia/', logoUrl: 'https://www.bagmanegroup.com/media/filer_public/84/e5/84e56d04-8de4-45ca-8bc7-bfb272576c74/nvidia.png' },
      { name: 'Samsung', website: 'https://www.samsung.com/', sourceUrl: bagmaneSource, linkedin: 'https://www.linkedin.com/company/samsung-electronics/', logoUrl: 'https://www.bagmanegroup.com/media/filer_public/45/4d/454d6e83-91c5-4f60-beba-0da8aeb2ed0a/samsung.webp' },
      { name: 'Visa', website: 'https://www.visa.com/', sourceUrl: bagmaneSource, linkedin: 'https://www.linkedin.com/company/visa/', logoUrl: 'https://www.bagmanegroup.com/media/filer_public/e0/fc/e0fc9f5a-a784-4a67-99a3-f85da0516296/visa.png' },
      { name: 'Boeing', website: 'https://www.boeing.com/', sourceUrl: bagmaneSource, linkedin: 'https://www.linkedin.com/company/boeing/', logoUrl: 'https://www.bagmanegroup.com/media/filer_public/93/c7/93c7368c-b3e5-4e2e-9996-b185eae27665/boieng_1.png' },
      { name: 'Accenture', website: 'https://www.accenture.com/', sourceUrl: bagmaneSource, linkedin: 'https://www.linkedin.com/company/accenture/', logoUrl: 'https://www.bagmanegroup.com/media/filer_public/65/df/65df74aa-7e18-46de-917b-7cf33a840fe3/accenture.png' },
      { name: 'Ericsson', website: 'https://www.ericsson.com/', sourceUrl: bagmaneSource, linkedin: 'https://www.linkedin.com/company/ericsson/', logoUrl: 'https://www.bagmanegroup.com/media/filer_public/36/ea/36eabc39-4f16-4f95-805b-b707f0d130a4/erricson.png' },
      { name: 'Ernst & Young (EY)', website: 'https://www.ey.com/', sourceUrl: bagmaneSource, logoUrl: 'https://www.bagmanegroup.com/media/filer_public/3b/94/3b941319-5c88-4fd0-8f83-055610be664a/ey.png' },
      { name: 'Mphasis', website: 'https://www.mphasis.com/', sourceUrl: bagmaneSource, logoUrl: 'https://www.bagmanegroup.com/media/filer_public/4f/07/4f07ee63-8fb7-4f53-a606-24683ebbc068/mphasis.png' },
      { name: 'Arm', website: 'https://www.arm.com/', sourceUrl: bagmaneSource, logoUrl: 'https://www.bagmanegroup.com/media/filer_public/2e/e6/2ee6cf82-ec32-4bc4-a888-210db2bf8172/arm.png' },
      { name: 'AB InBev', website: 'https://www.ab-inbev.com/', sourceUrl: bagmaneSource, logoUrl: 'https://www.bagmanegroup.com/media/filer_public/bd/07/bd0773e3-0fe5-4ba3-af39-40a342fdefba/abin.png' },
      { name: 'EMC (Dell)', website: 'https://www.dell.com/', sourceUrl: bagmaneSource, logoUrl: 'https://www.bagmanegroup.com/media/filer_public/4b/16/4b16f336-0f96-42be-8ff7-ba446e800999/dellemc.png' }
    ]
  },
  {
    id: 'google_ananta',
    name: 'Google Ananta',
    area: 'Mahadevapura',
    googlePlaceId: 'ChIJcQgRXwARrjsRCJNOvPpSetM',
    // Approximate OSM office-way centre: https://www.openstreetmap.org/way/1087930060.
    lat: 12.9828270,
    lng: 77.6917293,
    mapCoverage: 'corridor',
    description: 'Build a campus-specific mobility brief for the Google Ananta area in Mahadevapura.',
    painHypothesis: 'K.R. Puram Metro is about 2.5 km from Ananta according to the venue guide; test whether a last-mile shuttle would help.',
    seoQuery: 'corporate shuttle Google Ananta Mahadevapura',
    leadAngle: 'Research campus access and approach the workplace mobility team with a practical pickup and last-mile route proposal.',
    sourceUrl: 'https://events.linuxfoundation.org/grpconf-india/attend/venue-travel/',
    featuredCompanies: [
      { name: 'Google', website: 'https://about.google/', sourceUrl: anantaSource, linkedin: 'https://www.linkedin.com/company/google/' }
    ]
  }
];
