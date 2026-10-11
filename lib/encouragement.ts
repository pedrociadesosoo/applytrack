import type { EncouragementMode } from "@/lib/themes";

// Encouragement shown on the dashboard. Scripture is from the World English
// Bible (British Edition), which is public domain. The non-scripture lines
// are original to ApplyTrack.

export type MomentKind = "daily" | "rejected" | "progress" | "offer";

export interface Encouragement {
  text: string;
  reference?: string; // scripture only
}

const SCRIPTURE: Record<MomentKind, Encouragement[]> = {
  daily: [
    { text: "It is because of the LORD’s loving kindnesses that we are not consumed, because his compassion doesn’t fail. They are new every morning. Great is your faithfulness.", reference: "Lamentations 3:22–23" },
    { text: "Trust in the LORD with all your heart, and don’t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.", reference: "Proverbs 3:5–6" },
    { text: "But those who wait for the LORD will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.", reference: "Isaiah 40:31" },
    { text: "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.", reference: "Philippians 4:6–7" },
    { text: "Commit your deeds to the LORD, and your plans shall succeed.", reference: "Proverbs 16:3" },
    { text: "Therefore don’t be anxious for tomorrow, for tomorrow will be anxious for itself. Each day’s own evil is sufficient.", reference: "Matthew 6:34" },
    { text: "Let’s not be weary in doing good, for we will reap in due season, if we don’t give up.", reference: "Galatians 6:9" },
    { text: "And whatever you do, work heartily, as for the Lord, and not for men.", reference: "Colossians 3:23" },
    { text: "This is the day that the LORD has made. We will rejoice and be glad in it!", reference: "Psalm 118:24" },
  ],
  rejected: [
    { text: "“For I know the thoughts that I think toward you,” says the LORD, “thoughts of peace, and not of evil, to give you hope and a future.”", reference: "Jeremiah 29:11" },
    { text: "We know that all things work together for good for those who love God, for those who are called according to his purpose.", reference: "Romans 8:28" },
    { text: "The LORD is near to those who have a broken heart, and saves those who have a crushed spirit.", reference: "Psalm 34:18" },
    { text: "Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.", reference: "Isaiah 41:10" },
    { text: "The LORD himself is who goes before you. He will be with you. He will not fail you nor forsake you. Don’t be afraid. Don’t be discouraged.", reference: "Deuteronomy 31:8" },
    { text: "God is our refuge and strength, a very present help in trouble.", reference: "Psalm 46:1" },
  ],
  progress: [
    { text: "Haven’t I commanded you? Be strong and courageous. Don’t be afraid. Don’t be dismayed, for the LORD your God is with you wherever you go.", reference: "Joshua 1:9" },
    { text: "I can do all things through Christ, who strengthens me.", reference: "Philippians 4:13" },
    { text: "The LORD himself is who goes before you. He will be with you. He will not fail you nor forsake you.", reference: "Deuteronomy 31:8" },
    { text: "Commit your deeds to the LORD, and your plans shall succeed.", reference: "Proverbs 16:3" },
  ],
  offer: [
    { text: "Every good gift and every perfect gift is from above, coming down from the Father of lights.", reference: "James 1:17" },
    { text: "The LORD has done great things for us, and we are glad.", reference: "Psalm 126:3" },
    { text: "In everything give thanks, for this is the will of God in Christ Jesus toward you.", reference: "1 Thessalonians 5:18" },
    { text: "This is the day that the LORD has made. We will rejoice and be glad in it!", reference: "Psalm 118:24" },
  ],
};

const QUOTES: Record<MomentKind, Encouragement[]> = {
  daily: [
    { text: "Every application is a seed. You don’t have to see the harvest today to keep planting." },
    { text: "Progress isn’t always loud. Showing up again counts." },
    { text: "You only need one yes. Keep going." },
    { text: "Rest is part of the process too. Take a breath before the next one." },
    { text: "Your worth isn’t measured in response rates." },
  ],
  rejected: [
    { text: "A no from one company is a redirect, not a verdict on you." },
    { text: "Rejection stings because you tried. That’s brave." },
    { text: "This door closed. You’re still standing, and there are more doors." },
  ],
  progress: [
    { text: "They saw something in you. Go show them more of it." },
    { text: "Prepare well, then trust yourself. You belong in that room." },
  ],
  offer: [
    { text: "You did it. Celebrate before you decide anything." },
    { text: "All that effort led here. Be proud of yourself." },
  ],
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Same pick all day (and per moment), so it doesn't change on every refresh.
// `offset` keeps two moments of the same kind on one day from getting the
// same verse.
export function pickEncouragement(
  mode: EncouragementMode,
  kind: MomentKind,
  seed: string,
  offset = 0
): Encouragement | null {
  if (mode === "off") return null;
  const pool = (mode === "scripture" ? SCRIPTURE : QUOTES)[kind];
  return pool[(hash(`${seed}:${kind}`) + offset) % pool.length];
}
