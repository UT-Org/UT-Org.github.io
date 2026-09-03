/**
 * Prototype content.
 *
 * Keeping business data separate from the UI makes it easy to replace this
 * array with an API response when scheduling moves to a real backend.
 */
window.ABCTutoringData = {
  tutors: [
    {
      id: "elena-torres",
      name: "Elena Torres",
      subject: "Math",
      grades: "Grades 3-8",
      rate: 45,
      portraitClass: "p1",
      bio: "Patient problem-solver · 5 years teaching",
      nextAvailable: "Today at 4 PM",
    },
    {
      id: "marcus-reed",
      name: "Marcus Reed",
      subject: "Math",
      grades: "Grades 6-12",
      rate: 52,
      portraitClass: "p2",
      bio: "Algebra & geometry specialist",
      nextAvailable: "Tomorrow at 5:15 PM",
    },
    {
      id: "maya-chen",
      name: "Maya Chen",
      subject: "Math",
      grades: "Grades 6-12",
      rate: 55,
      portraitClass: "p3",
      bio: "Calculus coach · UT Austin graduate",
      nextAvailable: "Today at 4 PM",
    },
    {
      id: "arjun-patel",
      name: "Arjun Patel",
      subject: "Science",
      grades: "Grades 6-12",
      rate: 50,
      portraitClass: "p4",
      bio: "Biology & chemistry made clear",
      nextAvailable: "Wednesday at 3:30 PM",
    },
    {
      id: "claire-bennett",
      name: "Claire Bennett",
      subject: "Reading",
      grades: "Grades K-6",
      rate: 40,
      portraitClass: "p5",
      bio: "Literacy specialist · joyful learning",
      nextAvailable: "Tomorrow at 4 PM",
    },
    {
      id: "noah-williams",
      name: "Noah Williams",
      subject: "Math",
      grades: "Grades K-5",
      rate: 42,
      portraitClass: "p6",
      bio: "Elementary math confidence builder",
      nextAvailable: "Thursday at 5 PM",
    },
  ],
  bookingDates: [
    { label: "Tue", date: "Sep 8" },
    { label: "Wed", date: "Sep 9" },
    { label: "Thu", date: "Sep 10" },
  ],
  bookingTimes: ["4:00 PM", "5:15 PM", "6:30 PM"],
};
