export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

export type Professional = {
  id: string;
  name: string;
  role: string;
  initials: string;
};

export const services: Service[] = [
  {
    id: "corte",
    name: "Corte de cabelo",
    duration: 45,
    price: 45,
  },
  {
    id: "barba",
    name: "Barba",
    duration: 30,
    price: 30,
  },
  {
    id: "corte-barba",
    name: "Corte + Barba",
    duration: 70,
    price: 65,
  },
  {
    id: "sobrancelha",
    name: "Sobrancelha",
    duration: 20,
    price: 20,
  },
];

export const professionals: Professional[] = [
  {
    id: "lucas",
    name: "Lucas Almeida",
    role: "Barbeiro",
    initials: "LA",
  },
  {
    id: "rafael",
    name: "Rafael Costa",
    role: "Barbeiro",
    initials: "RC",
  },
  {
    id: "bruno",
    name: "Bruno Martins",
    role: "Especialista",
    initials: "BM",
  },
];

export const availableTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];
