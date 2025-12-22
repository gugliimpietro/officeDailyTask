export const TEAMS = [
  { id: 't1', name: 'Export Curriculum & Syllabus Dev' },
  { id: 't2', name: 'Training Needs Analysis' },
  { id: 't3', name: 'Coach Recruitment & Management' },
  { id: 't4', name: 'International Market Research' }
];

export const INITIAL_USERS = [
  { id: 'u1', username: 'boss', password: '123', name: 'Big Boss', role: 'ADMIN', teamId: null },
  { id: 'u2', username: 'leader1', password: '123', name: 'Curriculum Leader', role: 'TEAM_LEADER', teamId: 't1' },
  { id: 'u3', username: 'sadiro', password: '123', name: 'Sadiro', role: 'TEAM_MEMBER', teamId: 't1' },
  { id: 'u4', username: 'fatin', password: '123', name: 'Fatin', role: 'TEAM_MEMBER', teamId: 't1' },
  { id: 'u5', username: 'risti', password: '123', name: 'Risti', role: 'TEAM_MEMBER', teamId: 't1' },
  { id: 'u6', username: 'maya', password: '123', name: 'Maya', role: 'TEAM_MEMBER', teamId: 't1' },
  { id: 'u7', username: 'hesti', password: '123', name: 'Hesti', role: 'TEAM_MEMBER', teamId: 't1' },
  { id: 'u8', username: 'leader2', password: '123', name: 'Recruitment Leader', role: 'TEAM_LEADER', teamId: 't3' },
];

export const JOB_TYPES = [
  "Tersedianya bahan penyusunan kurikulum dan silabus program pendampingan ekspor (ECP) yang sesuai kebutuhan",
  "Tersedianya bahan penyusunan bahan ajar standar program pendampingan ekspor (ECP) yang sesuai kebutuhan",
  "Tersedianya bahan penyusunan kurikulum dan silabus pelatihan ekspor yang sesuai kebutuhan",
  "Tersedianya bahan tayang standar ekspor yang terkini dan sesuai kebutuhan",
  "Tersedianya bahan penyusunan kurikulum dan silabus pelatihan jasa perdagangan yang sesuai dengan kebutuhan"
];

export const INITIAL_TASKS = [
  {
    id: 1,
    code: 'TASK-0001',
    title: 'Develop curriculum syllabus for Export Coaching Program 2026',
    jobType: JOB_TYPES[0],
    description: 'Create the main framework for the new year program.',
    teamId: 't1',
    assigneeId: 'u3',
    priority: 'High',
    status: 'Running',
    dueDate: '2023-12-01',
    createdAt: new Date().toISOString(),
    comments: [],
    reopenRequested: false
  },
  // ... add the rest of your initial tasks here
];
