/**
 * All articles extracted from email issue XML (Liam, Beth, Annie, Grant, Jenni, Talia, Sarah #9, Ari).
 * Main images are not included — add in Studio or use image URLs from the emails.
 */

const brandExplainer =
  "Hookup Lists is a weekly chronicle of the highlights (and lowlights) from one person's actual hookup history.";
const disclaimer =
  "Disclaimer: All names and identifiable details have been modified to protect the reputations of our contributors in the eyes of their partners, colleagues, and parents.";

function article(slug, title, subtitle, summary, photoCredit, entries) {
  return {
    _type: "article",
    slug: { _type: "slug", current: slug },
    title,
    kicker: "Hookup Lists",
    subtitle,
    summary,
    brandExplainer,
    photoCredit,
    publishedDate: new Date().toISOString(),
    entries: entries.map((e) => ({ _type: "articleEntry", ...e })),
    disclaimer,
  };
}

export const liamArticle = article(
  "liam",
  "Liam's List",
  "Age 39. Male. Bisexual.",
  "Age 39. Male. Bisexual. From the movie theatre makeout to the Silly Goose—camp, morticians, and one witchy comedy writer.",
  "Photo by Ugip",
  [
    { age: "Age 14", title: "The Movie Theatre Makeout", body: "First movie date. We made out hard in a movie theatre. I consider it better than my first kiss, which was at youth leader camp. Not into it." },
    { age: "Age 16", title: "The One That Didn't Work", body: "My highschool girlfriend. We tried to have sex but it didn't work - no condom, no lube, no experience. We ended up calling it quits and snuggling instead." },
    { age: "Age 19", title: "The Not-Really-A-Joke", body: "He looked like a Jonas Brother. He was my brother's friend and he did it \"as a joke\" but I had a huge crush on him." },
    { age: "Age 23", title: "The Gravedigger", body: "A Mortician I dated. We hooked up after she passed her final exams. She texted me the next morning saying she didn't need therapy that week because the sex was so good. But I ended it because she was deader than her clients in bed." },
    { age: "Age 29", title: "The Legal Case", body: "A high powered lawyer for a large political party. She needed a regular hookup but was too busy for dating. When I took off my pants and got hard, she said , \"Oh thank god.\" I guess I'm a grower." },
    { age: "Age 35", title: "The Silly Goose", body: "A witchy comedy writer who I somehow got the attention of by wearing a tank top in public and yes-and-ing her bits. Our friends find us insufferable. I love my Goose to bits." },
  ]
);

export const bethArticle = article(
  "beth",
  "Beth's List",
  "Age: 38. Female. Straight.",
  "Age 38. Female. Straight. From the camp comedian to the Snake—seven years, one exit.",
  "Photo by Abi Allen",
  [
    { age: "Age 16", title: "The Camp Comedian", body: "My summer camp boyfriend. He made everyone laugh in his cabin. I also gave him my first hand job at the baseball diamond. He told me I did it wrong. I did not laugh." },
    { age: "Age 19", title: "The Camp Pothead", body: "We worked together at summer camp (I really have bad luck with summer camp boys). The day after we hooked up he got kicked out of camp for pot and I have not seen him since." },
    { age: "Age 22", title: "The Bad Boss", body: "He was 10 years older than me, my boss, and had another girlfriend in another city. I was convinced he would leave her for me. They're now married with a kid. Years later he'll have a near death experience and text me a half hearted apology." },
    { age: "Age 23", title: "The Irish Wish", body: "I got my groove back on my summer studying abroad and had sex with a rugby player and preschool teacher in Dublin. We made out in the back of a horse drawn carriage and had sex in a church." },
    { age: "Age 25", title: "The Film Connoisseur", body: "Sweet film nerd, worked as an Director of Photography, taught me how to appreciate watching movies, introduced me to David Lynch (loved) and David Cronenberg (hated). Good sex, but we didn't work out. He gave me a love of some of my favourite movies." },
    { age: "Age 31", title: "The Snake Eating His Own Tail", body: "Long term relationship. We lived together for 7 years. It started out great, but he became verbally abusive. We got in a cycle where he promised he would get better and never did. Finally left him after too long. Still dating and learning to love myself :)" },
  ]
);

export const annieArticle = article(
  "annie",
  "Annie's List",
  "Age: 37. Female. Straight.",
  "Age 37. Female. Straight. From the Dorito kisser to the Wet Puppets—Build Me Up Buttercup and all.",
  "Photo by Egor Ivlev",
  [
    { age: "Age 14", title: "The Dorito Kisser", body: "He was from another high school. We kissed in the bathroom at an eighth grade house party. He tasted like Doritos and it was too wet." },
    { age: "Age 19", title: "The Fingerbanger", body: "Guy who finger banged me in the alleyway next to a house party in college with the hopes of taking me home. Once we got back into the house, a dance party had erupted and I didn't want to leave so I told him I was staying. He left in a huff. I danced on a desk to Build Me Up Buttercup." },
    { age: "Age 23", title: "The Bored Best Friend", body: "One summer when all our friends were away, we had sex out of boredom and curiosity. We were lucky, because we kept communication open and it never affected our friendship. We only had sex three times and that was it. We remain good friends to this day." },
    { age: "Age 26", title: "The Ass-Hat Actor", body: "We were in a local play together, dated for 6 months. He studied Shakespeare, bragged that he was a method actor. After we had sex, the minute he came, he started talking about the best blow job he ever received from some girl he once knew. He told me I wasn't a good enough actor and he wanted to sleep with our married director. It ended there." },
    { age: "Age 30", title: "Shy Jazz Boy", body: "Super shy, quiet Jazz musician. I'm really outgoing so he liked that I could fill the air. I really liked him, but one day he told me he hooked up with his ex and wanted to see how things turned out with her. I cried in a Starbucks bathroom." },
    { age: "Age 32", title: "The Wet Puppets", body: "Together for 6 years on and off. He's a set builder and loves the movie category of \"wet puppets\" (Cronenberg's The Fly). I love him to this day but sometimes that's not enough." },
  ]
);

export const grantArticle = article(
  "grant",
  "Grant's List",
  "Age: 37. Male. Straight.",
  "Age 37. Male. Straight. From the eighth grade garden kiss to the Magic Woman—let's get ready to rumble.",
  "Photo by Annie Spratt",
  [
    { age: "Age 14", title: "The Eighth Grade Garden Kiss", body: "She wrote me a note in eighth grade math class saying she wanted to kiss me. She was already my girlfriend but we hadn't kissed yet. We communicated a lot by note writing. I took her on a springtime walk in my aunt's epic backyard garden and we finally kissed. It was sweet." },
    { age: "Age 19", title: "The Redheaded Friend of a Friend", body: "I feel so bad to this day – she wanted more and I only wanted to have casual sex, but I wasn't the best at communicating yet. I was 19, but still. She wore boxer-briefs and I thought it was so hot." },
    { age: "Age 22", title: "The Ex-Con", body: "We met at the grocery store. Don't worry, she was only an ex-con for drugs (I think... I mean that's what she told me). We had sex in the public bathroom of a community center." },
    { age: "Age 25", title: "The Face Finish", body: "We were casually dating for a few months and doing a lot of sexual exploration together. She said she always wanted someone to \"finish\" on her face. We talked about it, planned it out and she was super excited. The night we finally did it, she burst into tears immediately when it happened. I held her and promised to never do it again. Good lesson that fantasy does not always equal reality." },
    { age: "Age 32", title: "The Wrestling Announcer", body: "We met on an app, went on a date, and when we went back to mine she went to go down on me, took my dick in her hands and used it like a microphone saying, \"let's get ready to rummmblllleee\". She was hilarious. We dated for 3 years." },
    { age: "Age 35", title: "The Magic Woman", body: "We met at a board game cafe when I moved to a new city and wanted to learn how to play Magic the Gathering. I went to a local meet up and she invited me to join her friend's game. We've been best friends ever since. And now she's my wife." },
  ]
);

export const jenniArticle = article(
  "jenni",
  "Jenni's List",
  "Age 37. Female. Bisexual.",
  "Age 37. Female. Bisexual. From the first love to the Australian—donuts, Selena Gomez, and getting lost in Florence.",
  "Photo by Timur Shakerzianov",
  [
    { age: "Age 17", title: "The First Love", body: "My first real boyfriend. He was in university which made me feel really cool and important. He was really charming and funny and obsessed with the Strokes. We dated for two years." },
    { age: "Age 23", title: "The Drummer", body: "He said my dog looked like a rat (she was the most adorable pomeranian, actually). He wanted to see me all the time for a month and then he got back together with his ex and ghosted me." },
    { age: "Age 26", title: "The Selena Babe", body: "We'd had a flirtation going in person for a while and then stumbled on each other on a dating app. I went over to her house and we hooked up while listening to \"Hands to Myself\" by Selena Gomez. She bought us donuts for breakfast the next morning." },
    { age: "Age 27", title: "The Adulterer", body: "We hooked up in the bathroom of a comedy club and saw each other for a few weeks. One night, we were on a date at a bar, and when we went outside, they spotted someone they knew across the street and pushed me into the bushes. It turned out they had a girlfriend." },
    { age: "Age 28", title: "The Good Friend", body: "We were good friends and tried dating for about 2 weeks, but it was clear we were only meant to be friends. He broke up with me in a mall food court with a mouth full of Popeyes." },
    { age: "Age 30", title: "The Australian", body: "We met at a friend's destination wedding in Italy when we accidentally got separated from the group on a daytrip in Florence and were stuck together for the day. Yes, it was like a romantic comedy, just with worse jokes and better chemistry. He's now my husband and and the only person I'd willingly get lost with again." },
  ]
);

export const taliaArticle = article(
  "talia",
  "Talia's List",
  "Age: 39. Female. Straight.",
  "Age 39. Female. Straight. From the bar mitzvah kiss to the Blind Date—teal Sunfire, raves in castles, cologne ads.",
  "Photo by Illia Horokhovsky",
  [
    { age: "Age 13", title: "The Bar Mitzvah Kiss", body: "My first real kiss. In a field at an amusement park rented out for Adam Rabinovitch's luxe bar mitzvah. Awkward. Messy. I somehow walked away with a hickey." },
    { age: "Age 16", title: "The Tortured Writer", body: "He went to my camp friend's high school. He didn't wear underwear. Was a real tortured writer. We'd drive around in my teal Pontiac Sunfire, park, get high, and make out until my neck hurt." },
    { age: "Age 17", title: "The Summer I Got Off Accutane", body: "It was the summer after I got off my acne meds and was freshly de-braced. I met him at a house party I was def too young to be at. He was 10 years older than me. We fooled around for a few weeks. No \"sex-sex,\" which teenage me considered a legal loophole." },
    { age: "Age 22", title: "The Smooth Talking Law Student", body: "Met at a youth leadership conference. Polar opposite politics. One late night argument turned into a makeout session. We dated for three months. We'd hook up, then he'd rollerblade home. After two tempestuous months, we mutually broke it off in a mall parking lot." },
    { age: "Age 26", title: "The Foreign Mystery Man", body: "Met in a hostel kitchen while backpacking across Europe. Ended up at a rave in a castle. Kissed all the way down the hill as the sun came up. Never learned his last name, but still remember his rock hard abs." },
    { age: "Age 30", title: "The Competitive Sailor", body: "He looked like a cologne ad. He sailed 470 sailboats. FOR A LIVING. Terrible in bed. Stayed for the body." },
    { age: "Age 36", title: "The Blind Date", body: "Blind date. A theatre director turned psychologist. Great conversation, deeply intense. He dumped me twice. I forgave him once. He kicked off my losing streak. It's been three years of no sex. I know he just broke up with his new girlfriend. I keep resisting the urge to call him for a no-strings-attached fling, something I could never admit to my best friend, so I haven't done it. Yet." },
  ]
);

export const sarahIssue9Article = article(
  "sarah",
  "Sarah's List",
  "Age: 42. Female. Straight.",
  "Age 42. Female. Straight. From the Presidents CD romantic to the clumsy journalist—fifteen years, two kids, one mortgage.",
  "Photo by Frederick Shaw",
  [
    { age: "Age 12", title: "The Presidents CD Romantic", body: "First kiss. A youth group dance party at the JCC. He gave me a Presidents of the United States of America CD for Valentine's Day. No tongue. No sparks. But my diary entry was basically fireworks." },
    { age: "Age 16", title: "The Gay Smoker", body: "We were both counselors at camp. Lean, aloof, smelled like sunscreen and Marlboros. I was obsessed. He came out four years later, which honestly just confirmed his hotness." },
    { age: "Age 21", title: "The Bureaucratic Lover", body: "Childhood friend turned \"first time\". I confessed my virginity. He said, \"We should fix that.\" We did. It was awkward and oddly bureaucratic." },
    { age: "Age 24", title: "The One Who Made Breakfast", body: "We met at a downtown bar while I was in grad school. The sex was meh, but he was studying mechanical engineering and playing in a band, which felt promising. He made breakfast in bed. Four months later, he dumped me to \"focus on his music.\"" },
    { age: "Age 25", title: "The Internet Cafe BitePhobic", body: "I was travelling Thailand. It was an internet café flirtation turned hotel-bar rendezvous. On our second night shagging at my guest house, I bit his shoulder. He ghosted. My sexual experimentation phase lasted exactly one nibble." },
    { age: "Age 26", title: "The Almost Forever", body: "We moved in together. He was open to converting for me. After a year and a half, we outgrew each other in slow motion. We broke up when he left for grad school and I was so relieved." },
    { age: "Age 27", title: "The Clumsy Journalist", body: "A journalist that spilled wine all over himself on our first date. It was a setup. I told him I wasn't looking for anything serious. He said he only did serious. Fifteen years, two kids, and one mortgage later, he was right." },
  ]
);

export const ariArticle = article(
  "ari",
  "Ari's List",
  "Age: 36. Female. Straight.",
  "Age 36. Female. Straight. From Man Bun to Pickle Ball Boy—wart hogs, Gollum, and 11 months and counting.",
  "Photo by Illia Horokhovsky",
  [
    { age: "Age 19", title: "Man Bun", body: "He was about to go down on me when he asked if I had a hair elastic. I did. He used it to construct an impressively serious man bun. He was good. But the man bun was… too much." },
    { age: "Age 20", title: "Millimeter Peter", body: "He was the university 6'1 football player, Liam Hemsworth lookalike, who I had a crush on for two years. When we finally went home together after the bar one night, I met his micro penis and received foreplay in which he nearly sucked on my nipples so aggressively, it later caused them to scab." },
    { age: "Age 23", title: "Gollum", body: "It was NYE and I was feeling sad after not having a midnight kiss. I invited over a guy that I knew desperately wanted to hook up with me but I always found him creepy. Before you know it, he's sucking my toes and grunting/whispering while referring to himself in third person." },
    { age: "Age 24", title: "Wart Hog", body: "I was seeing a guy I really liked from a mutual friend group. When his friends asked how the sex was, I referred to his wiener as a \"wart hog\". While I thought I was complimenting his size, I didn't realize it made it sound like he had genital warts. He never spoke to me again after that and his friends still call him Wart Hog." },
    { age: "Age 30", title: "Ticking Time Bomb", body: "Went on a weekend getaway and he was going down on me when all of the sudden he got up in the middle of it and said he had to go to the bathroom. When he came back, he just lied next to me and started talking as if nothing happened and I wasn't lying there like a wet cloth on the bed." },
    { age: "Age 32", title: "Friend Zoned", body: "Met up with a guy I met online who I seemed to have a lot in common with, but something felt off. It wasn't until he told me that Ross was his favourite character from friends that I knew I'd never see him again." },
    { age: "Age 34", title: "Hinge Date", body: "I dated a guy I met on hinge for a few months. At first things were great, it seemed like we agreed on politics and world views. The longer we dated, the more it became clear he was telling me what I wanted to hear and actually had some pretty regressive views. We broke up after an argument about the Barbie movie." },
    { age: "Age 36", title: "Pickle Ball Boy", body: "We met playing pickle ball with our mutual friends. It turned into post pickle ball coffee dates, then drink dates, next thing I know I'm in a pickle ball league and we've been dating for 11 months." },
  ]
);

export const allEmailArticles = [
  liamArticle,
  bethArticle,
  annieArticle,
  grantArticle,
  jenniArticle,
  taliaArticle,
  sarahIssue9Article,
  ariArticle,
];
