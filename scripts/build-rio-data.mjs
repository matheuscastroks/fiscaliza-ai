import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fakeCitizens = [
  { id: 'citizen-carlos', name: 'Carlos Eduardo Mendes', email: 'carlos.mendes@email.com', neighborhood: 'Copacabana', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-mariana', name: 'Mariana Siqueira', email: 'mariana.siqueira@email.com', neighborhood: 'Tijuca', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-rodrigo', name: 'Rodrigo Vasconcelos', email: 'rodrigo.vasconcelos@email.com', neighborhood: 'Barra da Tijuca', avatar: '/api/demo-media/avatar-gestao.jpg' },
  { id: 'citizen-camila', name: 'Camila Duarte', email: 'camila.duarte@email.com', neighborhood: 'Botafogo', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-lucas', name: 'Lucas Peixoto', email: 'lucas.peixoto@email.com', neighborhood: 'Méier', avatar: '/api/demo-media/avatar-admin.jpg' },
  { id: 'citizen-fernanda', name: 'Fernanda Albuquerque', email: 'fernanda.albuquerque@email.com', neighborhood: 'Campo Grande', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-thiago', name: 'Thiago Nogueira', email: 'thiago.nogueira@email.com', neighborhood: 'Ipanema', avatar: '/api/demo-media/avatar-admin.jpg' },
  { id: 'citizen-priscila', name: 'Priscila Matos', email: 'priscila.matos@email.com', neighborhood: 'Madureira', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-roberto', name: 'Roberto Fonseca', email: 'roberto.fonseca@email.com', neighborhood: 'Lapa', avatar: '/api/demo-media/avatar-gestao.jpg' },
  { id: 'citizen-juliana', name: 'Juliana Guimarães', email: 'juliana.guimaraes@email.com', neighborhood: 'Santa Teresa', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-andre', name: 'André Luiz Ramos', email: 'andre.ramos@email.com', neighborhood: 'Bangu', avatar: '/api/demo-media/avatar-admin.jpg' },
  { id: 'citizen-aline', name: 'Aline Ferreira', email: 'aline.ferreira@email.com', neighborhood: 'Flamengo', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-gabriel', name: 'Gabriel Pires', email: 'gabriel.pires@email.com', neighborhood: 'Leblon', avatar: '/api/demo-media/avatar-gestao.jpg' },
  { id: 'citizen-vanessa', name: 'Vanessa Carvalho', email: 'vanessa.carvalho@email.com', neighborhood: 'Recreio dos Bandeirantes', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-marcelo', name: 'Marcelo Antunes', email: 'marcelo.antunes@email.com', neighborhood: 'São Cristóvão', avatar: '/api/demo-media/avatar-admin.jpg' },
  { id: 'citizen-larissa', name: 'Larissa Coutinho', email: 'larissa.coutinho@email.com', neighborhood: 'Vila Isabel', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-felipe', name: 'Felipe Medeiros', email: 'felipe.medeiros@email.com', neighborhood: 'Taquara', avatar: '/api/demo-media/avatar-gestao.jpg' },
  { id: 'citizen-tatiane', name: 'Tatiane Rocha', email: 'tatiane.rocha@email.com', neighborhood: 'Penha', avatar: '/api/demo-media/avatar-ana.jpg' },
  { id: 'citizen-diego', name: 'Diego Brandão', email: 'diego.brandao@email.com', neighborhood: 'Jardim Guanabara', avatar: '/api/demo-media/avatar-admin.jpg' },
  { id: 'citizen-renata', name: 'Renata Xavier', email: 'renata.xavier@email.com', neighborhood: 'Glória', avatar: '/api/demo-media/avatar-ana.jpg' },
];

const fakeStaff = [
  { id: 'staff-rioluz', name: 'Rioluz Operacional', email: 'rioluz@fiscaliza.rio.gov.br', role: 'staff', sector: 'Iluminação Pública' },
  { id: 'staff-comlurb', name: 'Comlurb Limpeza Urbana', email: 'comlurb@fiscaliza.rio.gov.br', role: 'staff', sector: 'Limpeza Urbana' },
  { id: 'staff-seconserva', name: 'Seconserva Vias e Calçadas', email: 'seconserva@fiscaliza.rio.gov.br', role: 'staff', sector: 'Conservação e Vias' },
  { id: 'staff-cetrio', name: 'CET-Rio Engenharia de Tráfego', email: 'cetrio@fiscaliza.rio.gov.br', role: 'staff', sector: 'Engenharia de Tráfego' },
];

const bairros = [
  // 1-5 Centro & Portuária
  {
    name: 'Centro', slug: 'centro',
    streets: [
      { address: 'Rua da Assembleia, 40', cep: '20011-000', lat: -22.9044, lng: -43.1768 },
      { address: 'Rua Uruguaiana, 120', cep: '20050-090', lat: -22.9038, lng: -43.1813 },
      { address: 'Praça XV de Novembro, s/n', cep: '20010-010', lat: -22.9030, lng: -43.1744 },
      { address: 'Avenida Presidente Vargas, 1000', cep: '20210-030', lat: -22.9062, lng: -43.1900 },
    ],
  },
  {
    name: 'Lapa', slug: 'lapa',
    streets: [
      { address: 'Praça Cardeal Câmara (Arcos da Lapa), s/n', cep: '20230-070', lat: -22.9130, lng: -43.1795 },
      { address: 'Rua do Lavradio, 84', cep: '20230-070', lat: -22.9095, lng: -43.1830 },
      { address: 'Rua Riachuelo, 150', cep: '20230-014', lat: -22.9145, lng: -43.1840 },
      { address: 'Avenida Mem de Sá, 60', cep: '20230-150', lat: -22.9125, lng: -43.1820 },
    ],
  },
  {
    name: 'Santa Teresa', slug: 'santa-teresa',
    streets: [
      { address: 'Largo dos Guimarães, 15', cep: '20240-270', lat: -22.9232, lng: -43.1856 },
      { address: 'Rua Paschoal Carlos Magno, 100', cep: '20240-290', lat: -22.9240, lng: -43.1865 },
      { address: 'Rua Almirante Alexandrino, 310', cep: '20241-260', lat: -22.9270, lng: -43.1910 },
      { address: 'Largo das Neves, s/n', cep: '20240-250', lat: -22.9195, lng: -43.1870 },
    ],
  },
  {
    name: 'Glória', slug: 'gloria',
    streets: [
      { address: 'Rua da Glória, 190', cep: '22211-110', lat: -22.9204, lng: -43.1762 },
      { address: 'Praça Paris, s/n', cep: '20020-000', lat: -22.9168, lng: -43.1755 },
      { address: 'Rua Benjamin Constant, 120', cep: '20241-150', lat: -22.9205, lng: -43.1790 },
      { address: 'Rua Cândido Mendes, 78', cep: '20241-220', lat: -22.9190, lng: -43.1810 },
    ],
  },
  {
    name: 'Santo Cristo', slug: 'santo-cristo',
    streets: [
      { address: 'Rua Santo Cristo, 140', cep: '20220-305', lat: -22.8980, lng: -43.1990 },
      { address: 'Rua da Gamboa, 215', cep: '20220-750', lat: -22.8995, lng: -43.1950 },
      { address: 'Praça Coronel Assunção, s/n', cep: '20220-650', lat: -22.8970, lng: -43.2010 },
      { address: 'Avenida Rodrigues Alves, 435', cep: '20220-360', lat: -22.8940, lng: -43.2020 },
    ],
  },

  // 6-14 Zona Sul
  {
    name: 'Copacabana', slug: 'copacabana',
    streets: [
      { address: 'Avenida Atlântica, 2600', cep: '22070-000', lat: -22.9698, lng: -43.1832 },
      { address: 'Rua Barata Ribeiro, 350', cep: '22040-001', lat: -22.9665, lng: -43.1810 },
      { address: 'Rua Santa Clara, 142', cep: '22041-010', lat: -22.9715, lng: -43.1880 },
      { address: 'Praça Serzedelo Correia, s/n', cep: '22040-050', lat: -22.9680, lng: -43.1845 },
    ],
  },
  {
    name: 'Ipanema', slug: 'ipanema',
    streets: [
      { address: 'Rua Visconde de Pirajá, 351', cep: '22410-002', lat: -22.9840, lng: -43.2045 },
      { address: 'Praça Nossa Senhora da Paz, s/n', cep: '22420-030', lat: -22.9835, lng: -43.2060 },
      { address: 'Rua Garcia d\'Ávila, 134', cep: '22421-010', lat: -22.9845, lng: -43.2085 },
      { address: 'Avenida Vieira Souto, 510', cep: '22420-002', lat: -22.9870, lng: -43.2020 },
    ],
  },
  {
    name: 'Leblon', slug: 'leblon',
    streets: [
      { address: 'Avenida Ataulfo de Paiva, 658', cep: '22440-032', lat: -22.9840, lng: -43.2230 },
      { address: 'Praça Antero de Quental, s/n', cep: '22440-040', lat: -22.9845, lng: -43.2245 },
      { address: 'Rua Dias Ferreira, 210', cep: '22431-050', lat: -22.9830, lng: -43.2270 },
      { address: 'Avenida Delfim Moreira, 380', cep: '22441-000', lat: -22.9875, lng: -43.2215 },
    ],
  },
  {
    name: 'Botafogo', slug: 'botafogo',
    streets: [
      { address: 'Rua Voluntários da Pátria, 230', cep: '22270-000', lat: -22.9515, lng: -43.1840 },
      { address: 'Rua São Clemente, 185', cep: '22260-001', lat: -22.9525, lng: -43.1890 },
      { address: 'Praça Nelson Mandela, s/n', cep: '22260-005', lat: -22.9510, lng: -43.1830 },
      { address: 'Praia de Botafogo, 340', cep: '22250-040', lat: -22.9460, lng: -43.1815 },
    ],
  },
  {
    name: 'Flamengo', slug: 'flamengo',
    streets: [
      { address: 'Rua Marquês de Abrantes, 92', cep: '22230-061', lat: -22.9370, lng: -43.1790 },
      { address: 'Rua Senador Vergueiro, 150', cep: '22230-001', lat: -22.9350, lng: -43.1775 },
      { address: 'Parque do Flamengo, altura do Castelinho', cep: '20021-140', lat: -22.9320, lng: -43.1740 },
      { address: 'Rua Paissandu, 110', cep: '22210-080', lat: -22.9365, lng: -43.1810 },
    ],
  },
  {
    name: 'Laranjeiras', slug: 'laranjeiras',
    streets: [
      { address: 'Rua das Laranjeiras, 305', cep: '22240-000', lat: -22.9340, lng: -43.1870 },
      { address: 'Praça São Salvador, s/n', cep: '22231-130', lat: -22.9335, lng: -43.1825 },
      { address: 'Rua Alice, 120', cep: '22241-020', lat: -22.9375, lng: -43.1905 },
      { address: 'Rua General Glicério, 240', cep: '22245-120', lat: -22.9405, lng: -43.1920 },
    ],
  },
  {
    name: 'Gávea', slug: 'gavea',
    streets: [
      { address: 'Praça Santos Dumont, s/n', cep: '22470-060', lat: -22.9750, lng: -43.2280 },
      { address: 'Rua Marquês de São Vicente, 188', cep: '22451-041', lat: -22.9775, lng: -43.2320 },
      { address: 'Rua dos Oitis, 45', cep: '22451-050', lat: -22.9760, lng: -43.2295 },
      { address: 'Estrada da Gávea, 70', cep: '22451-263', lat: -22.9810, lng: -43.2370 },
    ],
  },
  {
    name: 'Jardim Botânico', slug: 'jardim-botanico',
    streets: [
      { address: 'Rua Jardim Botânico, 650', cep: '22460-000', lat: -22.9660, lng: -43.2190 },
      { address: 'Rua Pacheco Leão, 256', cep: '22460-030', lat: -22.9680, lng: -43.2240 },
      { address: 'Rua Lopes Quintas, 110', cep: '22460-010', lat: -22.9645, lng: -43.2175 },
      { address: 'Rua Von Martius, 22', cep: '22460-040', lat: -22.9675, lng: -43.2205 },
    ],
  },
  {
    name: 'São Conrado', slug: 'sao-conrado',
    streets: [
      { address: 'Estrada da Gávea, 847', cep: '22610-001', lat: -22.9960, lng: -43.2550 },
      { address: 'Avenida Prefeito Mendes de Morais, 400', cep: '22610-095', lat: -22.9985, lng: -43.2620 },
      { address: 'Rua São Conrado, 60', cep: '22610-180', lat: -22.9940, lng: -43.2580 },
      { address: 'Estrada das Canoas, 120', cep: '22610-210', lat: -22.9890, lng: -43.2610 },
    ],
  },

  // 15-25 Zona Norte
  {
    name: 'Tijuca', slug: 'tijuca',
    streets: [
      { address: 'Praça Saens Peña, s/n', cep: '20520-050', lat: -22.9245, lng: -43.2325 },
      { address: 'Rua Conde de Bonfim, 450', cep: '20520-054', lat: -22.9270, lng: -43.2360 },
      { address: 'Rua Haddock Lobo, 320', cep: '20260-142', lat: -22.9180, lng: -43.2190 },
      { address: 'Praça Afonso Pena, s/n', cep: '20270-244', lat: -22.9185, lng: -43.2175 },
    ],
  },
  {
    name: 'Maracanã', slug: 'maracana',
    streets: [
      { address: 'Avenida Maracanã, 780', cep: '20271-111', lat: -22.9125, lng: -43.2290 },
      { address: 'Rua São Francisco Xavier, 410', cep: '20550-012', lat: -22.9160, lng: -43.2270 },
      { address: 'Praça Maracanã, s/n', cep: '20271-130', lat: -22.9140, lng: -43.2340 },
      { address: 'Rua Professor Eurico Rabelo, 90', cep: '20271-150', lat: -22.9110, lng: -43.2310 },
    ],
  },
  {
    name: 'Vila Isabel', slug: 'vila-isabel',
    streets: [
      { address: 'Boulevard 28 de Setembro, 280', cep: '20551-030', lat: -22.9165, lng: -43.2470 },
      { address: 'Praça Barão de Drummond, s/n', cep: '20560-090', lat: -22.9150, lng: -43.2530 },
      { address: 'Rua Teodoro da Silva, 450', cep: '20560-001', lat: -22.9180, lng: -43.2490 },
      { address: 'Rua Torres Homem, 160', cep: '20551-070', lat: -22.9145, lng: -43.2450 },
    ],
  },
  {
    name: 'Grajaú', slug: 'grajau',
    streets: [
      { address: 'Praça Edmundo Rego, s/n', cep: '20561-190', lat: -22.9215, lng: -43.2620 },
      { address: 'Rua Engenheiro Richard, 120', cep: '20561-090', lat: -22.9200, lng: -43.2590 },
      { address: 'Rua Barão de Mesquita, 890', cep: '20540-003', lat: -22.9240, lng: -43.2560 },
      { address: 'Rua Uberaba, 75', cep: '20561-140', lat: -22.9230, lng: -43.2640 },
    ],
  },
  {
    name: 'Méier', slug: 'meier',
    streets: [
      { address: 'Rua Dias da Cruz, 310', cep: '20720-010', lat: -22.8985, lng: -43.2805 },
      { address: 'Praça Agripino Grieco, s/n', cep: '20720-011', lat: -22.8995, lng: -43.2820 },
      { address: 'Rua Medina, 85', cep: '20735-130', lat: -22.8960, lng: -43.2785 },
      { address: 'Rua Hermengarda, 130', cep: '20710-010', lat: -22.9010, lng: -43.2840 },
    ],
  },
  {
    name: 'Madureira', slug: 'madureira',
    streets: [
      { address: 'Estrada do Portela, 222', cep: '21351-050', lat: -22.8715, lng: -43.3375 },
      { address: 'Rua Soares Caldeira (Parque Madureira)', cep: '21351-140', lat: -22.8700, lng: -43.3410 },
      { address: 'Rua Carvalho de Souza, 180', cep: '21350-180', lat: -22.8735, lng: -43.3360 },
      { address: 'Rua Maria Freitas, 65', cep: '21351-010', lat: -22.8720, lng: -43.3390 },
    ],
  },
  {
    name: 'São Cristóvão', slug: 'sao-cristovao',
    streets: [
      { address: 'Campo de São Cristóvão, 250', cep: '20921-440', lat: -22.8965, lng: -43.2205 },
      { address: 'Quinta da Boa Vista (Alameda Principal)', cep: '20940-040', lat: -22.9055, lng: -43.2215 },
      { address: 'Rua São Cristóvão, 510', cep: '20940-001', lat: -22.9015, lng: -43.2180 },
      { address: 'Rua Figueira de Melo, 310', cep: '20941-000', lat: -22.9030, lng: -43.2240 },
    ],
  },
  {
    name: 'Penha', slug: 'penha',
    streets: [
      { address: 'Largo da Penha, s/n', cep: '21070-760', lat: -22.8445, lng: -43.2770 },
      { address: 'Avenida Brás de Pina, 450', cep: '21070-032', lat: -22.8465, lng: -43.2795 },
      { address: 'Rua dos Romeiros, 88', cep: '21070-660', lat: -22.8450, lng: -43.2755 },
      { address: 'Rua Ibiapina, 130', cep: '21070-550', lat: -22.8430, lng: -43.2810 },
    ],
  },
  {
    name: 'Jardim Guanabara', slug: 'jardim-guanabara',
    streets: [
      { address: 'Praia da Bica, 1020', cep: '21931-150', lat: -22.8120, lng: -43.2050 },
      { address: 'Estrada do Galeão, 2100', cep: '21931-522', lat: -22.8080, lng: -43.2110 },
      { address: 'Praça Makepeace Thackeray, s/n', cep: '21931-290', lat: -22.8140, lng: -43.2080 },
      { address: 'Rua Cambaúba, 420', cep: '21940-005', lat: -22.8105, lng: -43.2070 },
    ],
  },
  {
    name: 'Pavuna', slug: 'pavuna',
    streets: [
      { address: 'Praça Copérnico, s/n', cep: '21520-290', lat: -22.8065, lng: -43.3645 },
      { address: 'Avenida Pastor Martin Luther King Jr, 12000', cep: '21520-000', lat: -22.8090, lng: -43.3620 },
      { address: 'Rua Mercúrio, 150', cep: '21520-010', lat: -22.8080, lng: -43.3660 },
      { address: 'Rua Cícero, 75', cep: '21520-020', lat: -22.8050, lng: -43.3630 },
    ],
  },
  {
    name: 'Irajá', slug: 'iraja',
    streets: [
      { address: 'Avenida Monsenhor Félix, 480', cep: '21235-110', lat: -22.8340, lng: -43.3260 },
      { address: 'Praça Nossa Senhora da Apresentação, s/n', cep: '21235-080', lat: -22.8325, lng: -43.3280 },
      { address: 'Estrada Coronel Vieira, 210', cep: '21220-310', lat: -22.8360, lng: -43.3235 },
      { address: 'Rua Hannibal Porto, 90', cep: '21230-330', lat: -22.8310, lng: -43.3250 },
    ],
  },

  // 26-30 Zona Oeste
  {
    name: 'Barra da Tijuca', slug: 'barra-da-tijuca',
    streets: [
      { address: 'Avenida das Américas, 3500', cep: '22640-100', lat: -22.9995, lng: -43.3605 },
      { address: 'Avenida Lúcio Costa, 2800', cep: '22620-170', lat: -23.0115, lng: -43.3420 },
      { address: 'Avenida Olegário Maciel, 260', cep: '22621-200', lat: -23.0070, lng: -43.3080 },
      { address: 'Avenida Ayrton Senna, 2500', cep: '22775-002', lat: -22.9860, lng: -43.3650 },
    ],
  },
  {
    name: 'Recreio dos Bandeirantes', slug: 'recreio-dos-bandeirantes',
    streets: [
      { address: 'Avenida das Américas, 16000', cep: '22790-701', lat: -23.0180, lng: -43.4680 },
      { address: 'Avenida Lúcio Costa, altura do Posto 10', cep: '22795-008', lat: -23.0280, lng: -43.4600 },
      { address: 'Praça Tim Maia, s/n', cep: '22795-005', lat: -23.0315, lng: -43.4835 },
      { address: 'Avenida Glaucindo de Oliveira, 230', cep: '22795-200', lat: -23.0240, lng: -43.4650 },
    ],
  },
  {
    name: 'Taquara', slug: 'taquara',
    streets: [
      { address: 'Estrada do Tindiba, 1850', cep: '22740-360', lat: -22.9220, lng: -43.3710 },
      { address: 'Praça Barão da Taquara, s/n', cep: '22730-040', lat: -22.9195, lng: -43.3680 },
      { address: 'Estrada dos Bandeirantes, 1200', cep: '22710-569', lat: -22.9240, lng: -43.3750 },
      { address: 'Rua Nelson Cardoso, 380', cep: '22735-001', lat: -22.9205, lng: -43.3700 },
    ],
  },
  {
    name: 'Campo Grande', slug: 'campo-grande',
    streets: [
      { address: 'Rua Cesário de Melo, 2800', cep: '23050-102', lat: -22.9030, lng: -43.5590 },
      { address: 'Praça Doutor Raul Boaventura, s/n', cep: '23050-160', lat: -22.9050, lng: -43.5615 },
      { address: 'Estrada do Monteiro, 450', cep: '23045-830', lat: -22.9110, lng: -43.5550 },
      { address: 'Rua Augusto de Vasconcelos, 180', cep: '23050-340', lat: -22.9040, lng: -43.5570 },
    ],
  },
  {
    name: 'Bangu', slug: 'bangu',
    streets: [
      { address: 'Avenida Cônego de Vasconcelos, 210', cep: '21810-011', lat: -22.8785, lng: -43.4650 },
      { address: 'Praça Primeiro de Maio, s/n', cep: '21810-060', lat: -22.8795, lng: -43.4670 },
      { address: 'Rua Silva Cardoso, 420', cep: '21810-031', lat: -22.8765, lng: -43.4630 },
      { address: 'Estrada do Engenho, 350', cep: '21840-000', lat: -22.8740, lng: -43.4690 },
    ],
  },
];

// Curated themes and image pools
const photoPool = {
  road: ['road.jpg', 'sidewalk.jpg', 'accessible-path.jpg'],
  lighting: ['lighting.jpg', 'gloria-dark.jpg', 'gloria-light.jpg', 'legacy-light-1.jpg', 'legacy-light-2.jpg', 'legacy-light-3.jpg', 'legacy-light-4.jpg'],
  cleaning: ['waste.jpg', 'recycling.jpg'],
  others: ['crossing.jpg', 'benches.jpg', 'crossing-day.jpg', 'park-shade.jpg', 'park-path.jpg'],
  proposal: ['park-shade.jpg', 'crossing-day.jpg', 'accessible-path.jpg', 'recycling.jpg', 'gloria-light.jpg', 'park-path.jpg'],
  action: ['road.jpg', 'sidewalk.jpg', 'lighting.jpg', 'crossing.jpg', 'accessible-path.jpg', 'waste.jpg'],
};

// Realistic comment pools by context
const commentsPool = {
  road: [
    'Passei por aí hoje cedo e o desnível está piorando com as chuvas. Cuidado quem passa de moto!',
    'Veículos estão desviando pela contramão para não cair no buraco. Risco iminente de acidente.',
    'Agradecemos a atenção da equipe. O reparo com asfalto quente ficou muito bom.',
    'Já protocolei no 1746 também, quanto mais moradores registrarem aqui, mais rápido a prefeitura atende.',
  ],
  lighting: [
    'Esse trecho fica completamente deserto e escuro após as 18h. A sensação de insegurança é enorme.',
    'Dois postes seguidos estão apagados. Moradores e estudantes que voltam do ponto de ônibus precisam de luz urgente.',
    'Equipe da Rioluz acabou de passar por aqui para vistoriar. Esperamos a troca das lâmpadas em breve.',
    'Lâmpadas de LED novas instaladas! Ficou excelente a visibilidade da rua agora.',
  ],
  cleaning: [
    'Infelizmente algumas pessoas continuam descartando entulho fora do dia da coleta. Precisamos de fiscalização.',
    'O lixo está acumulando na calçada e atraindo roedores. A Comlurb precisa programar a remoção.',
    'Garis fizeram a limpeza completa hoje pela manhã. Parabéns pelo serviço rápido!',
    'Apoiando o relato. Um container ou ecoponto fixo resolveria esse descarte irregular.',
  ],
  others: [
    'A calçada tem pedras soltas que já causaram a queda de uma senhora idosa na semana passada.',
    'O tempo do semáforo de pedestres é curto demais para quem tem mobilidade reduzida atravessar em segurança.',
    'Os bancos da praça foram revitalizados e as crianças voltaram a brincar no local com segurança.',
    'Excelente iniciativa registrar isso aqui com foto e localização exata.',
  ],
  proposal: [
    'Apoiado plenamente! Essa melhoria vai transformar o dia a dia de quem mora e trabalha no bairro.',
    'Sugiro incluir também rampa de acessibilidade nos dois lados da travessia.',
    'A proposta foi muito bem estruturada, esperamos que a gestão municipal acolha e execute no plano de obras.',
    'Concordo 100%. Nossos idosos e crianças precisam desse espaço revitalizado.',
  ],
  action: [
    'Acompanhando as etapas de execução da prefeitura. Muito bom ver as máquinas no local.',
    'Trabalho sendo realizado com sinalização adequada e sem interditar totalmente o fluxo.',
    'Obra entregue com muita qualidade! Que a manutenção periódica seja mantida.',
    'A transparência de ver as fotos da evolução e prazos no aplicativo é um diferencial enorme.',
  ],
};

function ago(days, hours = 0) {
  const d = new Date('2026-10-19T18:00:00.000Z');
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function dueIn(days) {
  const d = new Date('2026-10-19T18:00:00.000Z');
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function generateRioDataset() {
  const allOccurrences = [];
  const allProposals = [];
  const allActions = [];

  bairros.forEach((bairro, bIdx) => {
    const bSlug = bairro.slug;
    const bName = bairro.name;
    const s = bairro.streets;

    // Pick 4 distinct citizens for this bairro
    const c1 = fakeCitizens[(bIdx * 3) % fakeCitizens.length];
    const c2 = fakeCitizens[(bIdx * 3 + 1) % fakeCitizens.length];
    const c3 = fakeCitizens[(bIdx * 3 + 2) % fakeCitizens.length];
    const c4 = fakeCitizens[(bIdx * 3 + 3) % fakeCitizens.length];

    // ==========================================
    // 4 OCCURRENCES PER BAIRRO
    // ==========================================
    // 1. Road (pending / in_progress)
    const occ1Id = `occ-${bSlug}-pavimento`;
    const occ1Img = photoPool.road[bIdx % photoPool.road.length];
    allOccurrences.push({
      id: occ1Id,
      municipalityId: '3304557',
      title: `Pavimento danificado em ${bName}`,
      description: `Asfalto desgastado com desnível e buracos junto ao bordo da via na altura de ${s[0].address}. Veículos e coletivos desviam bruscamente para a faixa central, gerando risco de colisão e desconforto para pedestres na travessia.`,
      category: 'road',
      status: bIdx % 2 === 0 ? 'in_progress' : 'pending',
      priority: 'high',
      location: {
        latitude: s[0].lat,
        longitude: s[0].lng,
        address: `${s[0].address} — ${bName}`,
        neighborhood: bName,
      },
      images: [`/api/demo-media/${occ1Img}`],
      reportedBy: c1.id,
      reportedAt: ago(12 + (bIdx % 10), 3),
      votes: 14 + ((bIdx * 7) % 45),
      comments: [
        {
          id: `cmt-${occ1Id}-1`,
          text: commentsPool.road[bIdx % commentsPool.road.length],
          userId: c2.id,
          userName: c2.name,
          createdAt: ago(10 + (bIdx % 10), 1),
          avatar: c2.avatar,
        },
        {
          id: `cmt-${occ1Id}-2`,
          text: commentsPool.road[(bIdx + 1) % commentsPool.road.length],
          userId: c3.id,
          userName: c3.name,
          createdAt: ago(8 + (bIdx % 10), 4),
          avatar: c3.avatar,
        },
      ],
      statusHistory: [
        {
          status: 'pending',
          source: 'citizen',
          at: ago(12 + (bIdx % 10), 3),
          justification: 'Relato registrado com evidência fotográfica e localização confirmada.',
          actor: c1.name,
        },
        ...(bIdx % 2 === 0 ? [{
          status: 'in_progress',
          source: 'management',
          at: ago(7 + (bIdx % 10), 2),
          justification: 'Equipe de manutenção viária designada para recomposição asfáltica.',
          actor: 'Seconserva Vias e Calçadas',
          sector: 'Conservação e Vias',
        }] : []),
      ],
    });

    // 2. Lighting (in_progress)
    const occ2Id = `occ-${bSlug}-iluminacao`;
    const occ2Img = photoPool.lighting[bIdx % photoPool.lighting.length];
    allOccurrences.push({
      id: occ2Id,
      municipalityId: '3304557',
      title: `Luminárias apagadas em ${bName}`,
      description: `Trecho da via pública com postes de iluminação com lâmpadas apagadas em ${s[1].address}. O local apresenta baixa visibilidade no período noturno, dificultando o deslocamento seguro de pedestres no retorno do trabalho e estudos.`,
      category: 'lighting',
      status: 'in_progress',
      priority: 'medium',
      location: {
        latitude: s[1].lat,
        longitude: s[1].lng,
        address: `${s[1].address} — ${bName}`,
        neighborhood: bName,
      },
      images: [`/api/demo-media/${occ2Img}`],
      reportedBy: c2.id,
      reportedAt: ago(15 + (bIdx % 8), 5),
      votes: 18 + ((bIdx * 5) % 35),
      comments: [
        {
          id: `cmt-${occ2Id}-1`,
          text: commentsPool.lighting[bIdx % commentsPool.lighting.length],
          userId: c1.id,
          userName: c1.name,
          createdAt: ago(13 + (bIdx % 8), 2),
          avatar: c1.avatar,
        },
        {
          id: `cmt-${occ2Id}-2`,
          text: commentsPool.lighting[(bIdx + 2) % commentsPool.lighting.length],
          userId: c4.id,
          userName: c4.name,
          createdAt: ago(11 + (bIdx % 8), 1),
          avatar: c4.avatar,
        },
      ],
      statusHistory: [
        {
          status: 'pending',
          source: 'citizen',
          at: ago(15 + (bIdx % 8), 5),
          justification: 'Falta de iluminação relatada por moradores do entorno.',
          actor: c2.name,
        },
        {
          status: 'in_progress',
          source: 'management',
          at: ago(10 + (bIdx % 8), 3),
          justification: 'Ordem de serviço aberta junto à concessionária de iluminação pública Rioluz.',
          actor: 'Rioluz Operacional',
          sector: 'Iluminação Pública',
        },
      ],
    });

    // 3. Cleaning (resolved)
    const occ3Id = `occ-${bSlug}-limpeza`;
    const occ3Img = photoPool.cleaning[bIdx % photoPool.cleaning.length];
    allOccurrences.push({
      id: occ3Id,
      municipalityId: '3304557',
      title: `Descarte irregular de resíduos em ${bName}`,
      description: `Acúmulo de resíduos sólidos e restos de podas depositados na calçada de ${s[2].address}. O material obstruía parcialmente a circulação e acumulava água de chuva, necessitando de recolhimento mecânico e higienização.`,
      category: 'cleaning',
      status: 'resolved',
      priority: 'medium',
      location: {
        latitude: s[2].lat,
        longitude: s[2].lng,
        address: `${s[2].address} — ${bName}`,
        neighborhood: bName,
      },
      images: [`/api/demo-media/${occ3Img}`],
      reportedBy: c3.id,
      reportedAt: ago(20 + (bIdx % 5), 4),
      resolvedAt: ago(5 + (bIdx % 3), 2),
      votes: 22 + ((bIdx * 3) % 40),
      comments: [
        {
          id: `cmt-${occ3Id}-1`,
          text: commentsPool.cleaning[bIdx % commentsPool.cleaning.length],
          userId: c4.id,
          userName: c4.name,
          createdAt: ago(18 + (bIdx % 5), 1),
          avatar: c4.avatar,
        },
        {
          id: `cmt-${occ3Id}-2`,
          text: commentsPool.cleaning[(bIdx + 2) % commentsPool.cleaning.length],
          userId: c1.id,
          userName: c1.name,
          createdAt: ago(4 + (bIdx % 3), 1),
          avatar: c1.avatar,
        },
      ],
      statusHistory: [
        {
          status: 'pending',
          source: 'citizen',
          at: ago(20 + (bIdx % 5), 4),
          justification: 'Relato de acúmulo de resíduos e entulho na calçada.',
          actor: c3.name,
        },
        {
          status: 'in_progress',
          source: 'management',
          at: ago(12 + (bIdx % 5), 2),
          justification: 'Roteiro de coleta especial programado pela gerência distrital da Comlurb.',
          actor: 'Comlurb Limpeza Urbana',
          sector: 'Limpeza Urbana',
        },
        {
          status: 'resolved',
          source: 'management',
          at: ago(5 + (bIdx % 3), 2),
          justification: 'Remoção concluída com caminhão basculante e passeio público desobstruído.',
          actor: 'Comlurb Limpeza Urbana',
          sector: 'Limpeza Urbana',
        },
      ],
    });

    // 4. Others (pending / in_progress)
    const occ4Id = `occ-${bSlug}-calcada`;
    const occ4Img = photoPool.others[bIdx % photoPool.others.length];
    allOccurrences.push({
      id: occ4Id,
      municipalityId: '3304557',
      title: `Calçada com pedras soltas e desnível em ${bName}`,
      description: `Passeio público apresentando peças soltas e raízes expostas ao longo de ${s[3].address}. Dificulta a passagem de carrinhos de bebê, cadeirantes e pedestres idosos, exigindo regularização da superfície.`,
      category: 'others',
      status: bIdx % 3 === 0 ? 'pending' : 'in_progress',
      priority: 'low',
      location: {
        latitude: s[3].lat,
        longitude: s[3].lng,
        address: `${s[3].address} — ${bName}`,
        neighborhood: bName,
      },
      images: [`/api/demo-media/${occ4Img}`],
      reportedBy: c4.id,
      reportedAt: ago(9 + (bIdx % 7), 2),
      votes: 11 + ((bIdx * 4) % 30),
      comments: [
        {
          id: `cmt-${occ4Id}-1`,
          text: commentsPool.others[bIdx % commentsPool.others.length],
          userId: c2.id,
          userName: c2.name,
          createdAt: ago(7 + (bIdx % 7), 1),
          avatar: c2.avatar,
        },
      ],
      statusHistory: [
        {
          status: 'pending',
          source: 'citizen',
          at: ago(9 + (bIdx % 7), 2),
          justification: 'Morador informou irregularidades no piso do passeio público.',
          actor: c4.name,
        },
        ...(bIdx % 3 !== 0 ? [{
          status: 'in_progress',
          source: 'management',
          at: ago(4 + (bIdx % 7), 1),
          justification: 'Vistoria técnica agendada para medição do trecho e solicitação de reparo.',
          actor: 'Seconserva Vias e Calçadas',
          sector: 'Conservação e Vias',
        }] : []),
      ],
    });

    // ==========================================
    // 4 PROPOSALS PER BAIRRO
    // ==========================================
    // Proposal 1: Calçadas acessíveis
    const prop1Id = `prop-${bSlug}-calcadas`;
    const prop1Img = photoPool.proposal[bIdx % photoPool.proposal.length];
    allProposals.push({
      id: prop1Id,
      municipalityId: '3304557',
      kind: 'proposal',
      title: `Calçadas Acessíveis e Contínuas em ${bName}`,
      summary: `Padronização do passeio público com faixas podotáteis e rebaixamento de guias em ${s[0].address}.`,
      body: `Esta proposta visa requalificar o percurso de pedestres em ${bName}, especificamente nas proximidades de ${s[0].address}. Propõe-se a recuperação do piso com acabamento antiderrapante, rebaixamento de calçadas nas esquinas para travessia em nível e instalação de piso tátil direcional para pessoas com deficiência visual. A intervenção facilitará o trajeto até pontos de transporte público e comércio local.`,
      neighborhood: bName,
      territory: {
        scope: 'location',
        neighborhood: bName,
        location: {
          latitude: s[0].lat + 0.0003,
          longitude: s[0].lng - 0.0003,
          address: `${s[0].address} — ${bName}`,
        },
      },
      images: [`/api/demo-media/${prop1Img}`],
      createdBy: c1.id,
      createdAt: ago(25 + (bIdx % 5), 4),
      responsible: 'Secretaria Municipal de Conservação - SECONSERVA',
      supports: 35 + ((bIdx * 9) % 65),
      comments: [
        {
          id: `cmt-${prop1Id}-1`,
          text: commentsPool.proposal[bIdx % commentsPool.proposal.length],
          userId: c2.id,
          userName: c2.name,
          createdAt: ago(20 + (bIdx % 5), 2),
          avatar: c2.avatar,
        },
        {
          id: `cmt-${prop1Id}-2`,
          text: commentsPool.proposal[(bIdx + 1) % commentsPool.proposal.length],
          userId: c3.id,
          userName: c3.name,
          createdAt: ago(15 + (bIdx % 5), 1),
          avatar: c3.avatar,
        },
      ],
      linkedIds: [occ1Id],
      status: bIdx % 3 === 0 ? 'accepted' : 'under_review',
      decision: bIdx % 3 === 0 ? 'Proposta aceita e incluída no plano de requalificação de calçadas do bairro.' : undefined,
      history: [
        {
          at: ago(18 + (bIdx % 5), 2),
          actor: 'Equipe de Gestão',
          from: 'submitted',
          to: 'under_review',
          text: 'Proposta encaminhada para análise técnica da equipe de mobilidade e conservação.',
        },
        ...(bIdx % 3 === 0 ? [{
          at: ago(10 + (bIdx % 5), 1),
          actor: 'Equipe de Gestão',
          from: 'under_review',
          to: 'accepted',
          text: 'Projeto aprovado pela diretoria distrital e incorporado ao cronograma da prefeitura.',
        }] : []),
      ],
    });

    // Proposal 2: Iluminação LED
    const prop2Id = `prop-${bSlug}-iluminacao`;
    const prop2Img = photoPool.proposal[(bIdx + 1) % photoPool.proposal.length];
    allProposals.push({
      id: prop2Id,
      municipalityId: '3304557',
      kind: 'proposal',
      title: `Modernização da Iluminação em LED em ${bName}`,
      summary: `Substituição de lâmpadas antigas de vapor por luminárias LED de alta eficiência em ${s[1].address}.`,
      body: `Moradores sugerem a modernização do parque de iluminação pública ao longo de ${s[1].address} e vias adjacentes em ${bName}. A implementação de tecnologia LED proporcionará maior luminosidade com menor consumo energético, aumentando a sensação de segurança para frequentadores e residentes durante o período noturno.`,
      neighborhood: bName,
      territory: {
        scope: 'location',
        neighborhood: bName,
        location: {
          latitude: s[1].lat - 0.0003,
          longitude: s[1].lng + 0.0003,
          address: `${s[1].address} — ${bName}`,
        },
      },
      images: [`/api/demo-media/${prop2Img}`],
      createdBy: c2.id,
      createdAt: ago(22 + (bIdx % 6), 3),
      responsible: 'Rioluz - Companhia Municipal de Energia e Iluminação',
      supports: 42 + ((bIdx * 8) % 70),
      comments: [
        {
          id: `cmt-${prop2Id}-1`,
          text: commentsPool.proposal[(bIdx + 2) % commentsPool.proposal.length],
          userId: c4.id,
          userName: c4.name,
          createdAt: ago(18 + (bIdx % 6), 2),
          avatar: c4.avatar,
        },
      ],
      linkedIds: [occ2Id],
      status: 'under_review',
      history: [
        {
          at: ago(14 + (bIdx % 6), 1),
          actor: 'Equipe de Gestão',
          from: 'submitted',
          to: 'under_review',
          text: 'Projeto em estudo de viabilidade pelo programa Luz Maravilha da Rioluz.',
        },
      ],
    });

    // Proposal 3: Ponto de Coleta e Ecoponto
    const prop3Id = `prop-${bSlug}-ecoponto`;
    const prop3Img = photoPool.proposal[(bIdx + 2) % photoPool.proposal.length];
    allProposals.push({
      id: prop3Id,
      municipalityId: '3304557',
      kind: 'proposal',
      title: `Ponto de Entrega Voluntária de Recicláveis em ${bName}`,
      summary: `Instalação de contêineres seletivos para vidro, plástico e papel em ${s[2].address}.`,
      body: `A proposta solicita a implantação de um Ponto de Entrega Voluntária (PEV) bem sinalizado em ${s[2].address}, atendendo moradores e comércios locais de ${bName}. O objetivo é incentivar a separação correta de resíduos recicláveis, evitar o descarte irregular e fortalecer o trabalho de cooperativas de catadores credenciadas na cidade.`,
      neighborhood: bName,
      territory: {
        scope: 'location',
        neighborhood: bName,
        location: {
          latitude: s[2].lat + 0.0004,
          longitude: s[2].lng - 0.0002,
          address: `${s[2].address} — ${bName}`,
        },
      },
      images: [`/api/demo-media/${prop3Img}`],
      createdBy: c3.id,
      createdAt: ago(19 + (bIdx % 4), 2),
      responsible: 'Comlurb - Companhia Municipal de Limpeza Urbana',
      supports: 28 + ((bIdx * 6) % 55),
      comments: [
        {
          id: `cmt-${prop3Id}-1`,
          text: commentsPool.proposal[(bIdx + 3) % commentsPool.proposal.length],
          userId: c1.id,
          userName: c1.name,
          createdAt: ago(16 + (bIdx % 4), 1),
          avatar: c1.avatar,
        },
      ],
      linkedIds: [occ3Id],
      status: 'submitted',
      history: [],
    });

    // Proposal 4: Travessia e Praça
    const prop4Id = `prop-${bSlug}-praca`;
    const prop4Img = photoPool.proposal[(bIdx + 3) % photoPool.proposal.length];
    allProposals.push({
      id: prop4Id,
      municipalityId: '3304557',
      kind: 'proposal',
      title: `Revitalização da Praça e Área de Convivência em ${bName}`,
      summary: `Manutenção de bancos, plantio de árvores e iluminação do espaço público em ${s[3].address}.`,
      body: `Proposta para recuperar o mobiliário urbano, bancos de praça, áreas sombreadas e canteiros verdes na região de ${s[3].address} em ${bName}. A intervenção proporcionará um espaço acolhedor e seguro para integração comunitária de famílias, jovens e pessoas da terceira idade.`,
      neighborhood: bName,
      territory: {
        scope: 'location',
        neighborhood: bName,
        location: {
          latitude: s[3].lat - 0.0004,
          longitude: s[3].lng + 0.0002,
          address: `${s[3].address} — ${bName}`,
        },
      },
      images: [`/api/demo-media/${prop4Img}`],
      createdBy: c4.id,
      createdAt: ago(16 + (bIdx % 5), 1),
      responsible: 'Fundação Parques e Jardins / Seconserva',
      supports: 38 + ((bIdx * 7) % 60),
      comments: [
        {
          id: `cmt-${prop4Id}-1`,
          text: commentsPool.proposal[bIdx % commentsPool.proposal.length],
          userId: c3.id,
          userName: c3.name,
          createdAt: ago(12 + (bIdx % 5), 2),
          avatar: c3.avatar,
        },
      ],
      linkedIds: [occ4Id],
      status: 'submitted',
      history: [],
    });

    // ==========================================
    // 4 PUBLIC ACTIONS PER BAIRRO
    // ==========================================
    // Action 1: Asfalto Liso / Pavimentação
    const act1Id = `act-${bSlug}-asfalto`;
    const act1Img = photoPool.action[bIdx % photoPool.action.length];
    allActions.push({
      id: act1Id,
      municipalityId: '3304557',
      kind: 'action',
      title: `Operação Asfalto Liso em ${bName}`,
      summary: `Fresagem e recapeamento asfáltico em trechos críticos de ${s[0].address}.`,
      body: `Programa municipal de conservação viária executando fresagem mecânica, regularização da base e aplicação de concreto betuminoso usinado a quente (CBUQ). O serviço abrange o trecho viário de ${s[0].address} em ${bName}, garantindo maior durabilidade e redução de ruídos e acidentes.`,
      neighborhood: bName,
      territory: {
        scope: 'location',
        neighborhood: bName,
        location: {
          latitude: s[0].lat - 0.0002,
          longitude: s[0].lng + 0.0004,
          address: `${s[0].address} — ${bName}`,
        },
      },
      status: bIdx % 2 === 0 ? 'in_progress' : 'completed',
      progress: bIdx % 2 === 0 ? 65 : 100,
      dueAt: bIdx % 2 === 0 ? dueIn(25) : ago(2),
      evidence: [`/api/demo-media/${act1Img}`],
      responsible: 'Secretaria Municipal de Conservação - SECONSERVA',
      createdBy: 'staff-seconserva',
      createdAt: ago(35, 1),
      supports: 45 + ((bIdx * 6) % 50),
      comments: [
        {
          id: `cmt-${act1Id}-1`,
          text: commentsPool.action[bIdx % commentsPool.action.length],
          userId: c1.id,
          userName: c1.name,
          createdAt: ago(12, 3),
          avatar: c1.avatar,
        },
      ],
      linkedIds: [prop1Id],
      updates: [
        {
          at: ago(30, 2),
          text: 'Topografia e levantamento planialtimétrico concluídos pela equipe técnica.',
          actor: 'Seconserva Vias e Calçadas',
        },
        {
          at: ago(15, 4),
          text: 'Fresagem e nivelamento de pista executados no período noturno para menor impacto viário.',
          actor: 'Seconserva Vias e Calçadas',
        },
        ...(bIdx % 2 !== 0 ? [{
          at: ago(2, 1),
          text: 'Aplicação de massa asfáltica e nova pintura de solo finalizadas. Pista totalmente liberada.',
          actor: 'Seconserva Vias e Calçadas',
        }] : []),
      ],
    });

    // Action 2: Rioluz LED
    const act2Id = `act-${bSlug}-luz`;
    const act2Img = photoPool.action[(bIdx + 1) % photoPool.action.length];
    allActions.push({
      id: act2Id,
      municipalityId: '3304557',
      kind: 'action',
      title: `Programa Luz Maravilha em ${bName}`,
      summary: `Implantação de postes inteligentes e luminárias de LED na extensão de ${s[1].address}.`,
      body: `Ação governamental de modernização tecnológica do sistema de iluminação em ${bName}. Substitui luminárias a vapor de sódio por módulos LED de 150W com telegestão na altura de ${s[1].address}, garantindo eficiência luminosa superior a 130 lm/W e monitoramento remoto de falhas.`,
      neighborhood: bName,
      territory: {
        scope: 'location',
        neighborhood: bName,
        location: {
          latitude: s[1].lat + 0.0002,
          longitude: s[1].lng - 0.0004,
          address: `${s[1].address} — ${bName}`,
        },
      },
      status: 'in_progress',
      progress: 45 + ((bIdx * 5) % 40),
      dueAt: dueIn(30 + (bIdx % 15)),
      evidence: [`/api/demo-media/${act2Img}`],
      responsible: 'Rioluz - Companhia Municipal de Energia e Iluminação',
      createdBy: 'staff-rioluz',
      createdAt: ago(28, 2),
      supports: 52 + ((bIdx * 7) % 45),
      comments: [
        {
          id: `cmt-${act2Id}-1`,
          text: commentsPool.action[(bIdx + 1) % commentsPool.action.length],
          userId: c2.id,
          userName: c2.name,
          createdAt: ago(10, 2),
          avatar: c2.avatar,
        },
      ],
      linkedIds: [prop2Id],
      updates: [
        {
          at: ago(25, 2),
          text: 'Substituição dos braços metálicos e fixação dos conectores de telegestão.',
          actor: 'Rioluz Operacional',
        },
        {
          at: ago(8, 1),
          text: 'Instalação dos módulos LED no circuito principal em andamento.',
          actor: 'Rioluz Operacional',
        },
      ],
    });

    // Action 3: Mutirão Comlurb
    const act3Id = `act-${bSlug}-comlurb`;
    const act3Img = photoPool.action[(bIdx + 2) % photoPool.action.length];
    allActions.push({
      id: act3Id,
      municipalityId: '3304557',
      kind: 'action',
      title: `Mutirão de Limpeza e Conservação em ${bName}`,
      summary: `Varrição intensiva, roçada mecânica e desobstrução de bueiros e canaletas em ${s[2].address}.`,
      body: `Força-tarefa da Comlurb atuando em pontos de descarte crítico e vias de grande circulação de ${bName}, contemplando a área de ${s[2].address}. Inclui lavagem de logradouros com água de reuso, desobstrução de ralos e colocação de novas lixeiras basculantes.`,
      neighborhood: bName,
      territory: {
        scope: 'location',
        neighborhood: bName,
        location: {
          latitude: s[2].lat - 0.0003,
          longitude: s[2].lng + 0.0003,
          address: `${s[2].address} — ${bName}`,
        },
      },
      status: bIdx % 3 === 0 ? 'completed' : 'in_progress',
      progress: bIdx % 3 === 0 ? 100 : 70,
      dueAt: bIdx % 3 === 0 ? ago(3) : dueIn(10),
      evidence: [`/api/demo-media/${act3Img}`],
      responsible: 'Comlurb - Companhia Municipal de Limpeza Urbana',
      createdBy: 'staff-comlurb',
      createdAt: ago(21, 3),
      supports: 39 + ((bIdx * 5) % 40),
      comments: [
        {
          id: `cmt-${act3Id}-1`,
          text: commentsPool.action[(bIdx + 2) % commentsPool.action.length],
          userId: c3.id,
          userName: c3.name,
          createdAt: ago(7, 1),
          avatar: c3.avatar,
        },
      ],
      linkedIds: [prop3Id],
      updates: [
        {
          at: ago(18, 2),
          text: 'Início da roçada mecânica e capina nos canteiros centrais e laterais.',
          actor: 'Comlurb Limpeza Urbana',
        },
        {
          at: ago(6, 2),
          text: 'Remoção de resíduos volumosos e limpeza das caixas de ralo finalizada.',
          actor: 'Comlurb Limpeza Urbana',
        },
      ],
    });

    // Action 4: Mobilidade e Sinalização CET-Rio
    const act4Id = `act-${bSlug}-sinalizacao`;
    const act4Img = photoPool.action[(bIdx + 3) % photoPool.action.length];
    allActions.push({
      id: act4Id,
      municipalityId: '3304557',
      kind: 'action',
      title: `Requalificação de Travessias e Trânsito em ${bName}`,
      summary: `Pintura de faixas de pedestres, sincronização de semáforos e placas em ${s[3].address}.`,
      body: `Projeto da CET-Rio para aprimorar a segurança viária dos cruzamentos em ${bName}, com intervenções no perímetro de ${s[3].address}. Contempla repintura de faixas de pedestres termoplásticas, instalação de placas de regulamentação e revisão dos tempos de semáforo para maior tempo de travessia aos pedestres.`,
      neighborhood: bName,
      territory: {
        scope: 'location',
        neighborhood: bName,
        location: {
          latitude: s[3].lat + 0.0003,
          longitude: s[3].lng - 0.0003,
          address: `${s[3].address} — ${bName}`,
        },
      },
      status: 'planned',
      progress: 15,
      dueAt: dueIn(45),
      evidence: [`/api/demo-media/${act4Img}`],
      responsible: 'CET-Rio - Companhia de Engenharia de Tráfego',
      createdBy: 'staff-cetrio',
      createdAt: ago(14, 1),
      supports: 48 + ((bIdx * 8) % 50),
      comments: [
        {
          id: `cmt-${act4Id}-1`,
          text: commentsPool.action[(bIdx + 3) % commentsPool.action.length],
          userId: c4.id,
          userName: c4.name,
          createdAt: ago(5, 1),
          avatar: c4.avatar,
        },
      ],
      linkedIds: [prop4Id],
      updates: [
        {
          at: ago(10, 1),
          text: 'Estudo de contagem volumétrica e fluxo de pedestres concluído para dimensionamento semafórico.',
          actor: 'CET-Rio Engenharia de Tráfego',
        },
      ],
    });
  });

  return {
    fakeCitizens,
    fakeStaff,
    allOccurrences,
    allProposals,
    allActions,
  };
}

const data = generateRioDataset();

const content = `// Auto-generated demo dataset for Rio de Janeiro (30 representative bairros, 360 records)
import type { Occurrence, Proposal, PublicAction } from './contracts.js';

export const rioDemoCitizens = ${JSON.stringify(data.fakeCitizens, null, 2)};

export const rioDemoStaff = ${JSON.stringify(data.fakeStaff, null, 2)};

export const rioDemoOccurrences: Occurrence[] = ${JSON.stringify(data.allOccurrences, null, 2)};

export const rioDemoProposals: Proposal[] = ${JSON.stringify(data.allProposals, null, 2)};

export const rioDemoActions: PublicAction[] = ${JSON.stringify(data.allActions, null, 2)};
`;

const outputPath = resolve('shared/rio-data.ts');
writeFileSync(outputPath, content, 'utf8');

const backendProxy = `export * from '../../shared/rio-data.js';
`;
writeFileSync(resolve('backend/src/rio-data.ts'), backendProxy, 'utf8');

console.log(`Generated shared/rio-data.ts and backend/src/rio-data.ts with:
  - ${data.fakeCitizens.length} citizens
  - ${data.fakeStaff.length} staff
  - ${data.allOccurrences.length} occurrences
  - ${data.allProposals.length} proposals
  - ${data.allActions.length} public actions
  Across 30 Rio de Janeiro bairros!`);
