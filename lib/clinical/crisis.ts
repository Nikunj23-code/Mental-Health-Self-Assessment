export interface EmergencyResource {
  name: string;
  phone: string;
  description: string;
  hours: string;
  region: string;
}

export const EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    name: 'Tele-MANAS (Govt. of India)',
    phone: '14416',
    description: 'National Tele Mental Health Programme providing 24/7 free counseling in 20+ languages.',
    hours: '24/7 Toll-Free',
    region: 'India',
  },
  {
    name: 'KIRAN Mental Health Helpline',
    phone: '1800-599-0019',
    description: 'Department of Empowerment of Persons with Disabilities 24/7 mental health crisis support.',
    hours: '24/7 Toll-Free',
    region: 'India',
  },
  {
    name: 'Vandrevala Foundation',
    phone: '+91 9999 666 555',
    description: 'Free mental health support, crisis response, and emotional assistance.',
    hours: '24/7',
    region: 'India',
  },
  {
    name: 'Suicide & Crisis Lifeline',
    phone: '988',
    description: 'National suicide prevention and emotional distress hotline.',
    hours: '24/7 Toll-Free',
    region: 'USA / International',
  },
];
