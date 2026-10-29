import { Composition, Still } from "remotion";
import { BestPlannerApps, TOTAL } from "./Composition";
import { AppReview, FPS, REVIEW_TOTAL } from "./Review";
import { Explainer, EXPLAINER_TOTAL } from "./explainer/Explainer";
import { Thumbnail } from "./explainer/Thumbnail";
import { CarouselSlide, SLIDES } from "./carousel/Carousel";
import { VideoThumb } from "./video/Thumb";
import { SessionThumb } from "./video/SessionThumb";
import { FPS as LV_FPS, LongVideo, totalFrames, type VideoProps } from "./video/LongVideo";
import { INSTEAD, InsteadSlideView, TINY, TinySlideView } from "./carousel/MoreCarousels";
import { PairSlideView, SETS as PAIR_SETS } from "./carousel/MoreCarousels2";
import { SpecSlideIG, SpecSlideView, type Spec } from "./carousel/Spec";
import { SHIRI_FPS, SHIRI_TOTAL, ShiriPromo } from "./shiri/Shiri";
import { AppDemo, DEMO_FPS, DEMO_TOTAL } from "./demo/AppDemo";
import { CLIP_FPS, CUTS, ClipDemo, cutTotal } from "./demo/ClipDemo";
import { SV_FPS, SV_TOTAL, StoreVSL } from "./storevid/StoreVSL";
import { P_FPS, P_TOTAL, PitchFilm } from "./pitch/PitchFilm";
import { PR_FPS, PR_TOTAL, PlannerReview } from "./planners/PlannerReview";
import { UR_FPS, UR_TOTAL, UnstuckRank } from "./unstuck/UnstuckRank";
import { VS_FPS, VS_TOTAL, TiimoVsStructured } from "./versus/TiimoVsStructured";
import { CHATGPT, FINCH, GOBLIN, HABITICA, STRUCTURED, TICKTICK, TIIMO, TODOIST, VsThumb } from "./versus/Thumb";
import { GC_TOTAL, GoblinVsChatGPT } from "./versus/goblin-chatgpt/GoblinVsChatGPT";
import { STS_TOTAL, StuckToStarted } from "./reels/StuckToStarted";
import { STORY_TOTAL, StoryReel } from "./reels/StoryReel";
import { PL_FPS, PL_TOTAL, ParalysisReel } from "./paralysis/ParalysisReel";
import { WAITING_TOTAL, WaitingReel } from "./listreels/waiting/Waiting";
import { WaitingThumb } from "./listreels/waiting/WaitingScenes";
import { BEFORE_TOTAL, BeforeStartReel } from "./listreels/beforestart/BeforeStart";
import { TRANSLATOR_TOTAL, TranslatorReel } from "./listreels/translator/Translator";
import { WOMEN_TOTAL, WomenReel } from "./listreels/women/Women";
import { WINS_TOTAL, WinsReel } from "./listreels/wins/Wins";
import { ReelThumb } from "./listreels/ReelThumb";
import { WEIRDLY_TOTAL, WeirdlyGoodA, WeirdlyGoodB } from "./listreels/weirdlygood/WeirdlyGood";
import { CARE_TOTAL, CareMoreA } from "./listreels/caremore/CareMore";
import { SMART_FLOW_TOTAL, SMART_TOTAL, SmartAdhdA, SmartAdhdB, SmartFlowA, SmartFlowB } from "./listreels/smartadhd/SmartAdhd";
import { RIG_TEST_TOTAL, RigTest } from "./foco/RigTest";
import { TR_TOTAL, TodoReview } from "./todolists/TodoReview";
import { PaperFrame } from "./todolists/PaperFrames";
import { PAPER_TOTAL, PaperReview } from "./todolists/PaperReview";
import { PaperThumb } from "./todolists/PaperThumb";
import { HANDS_TOTAL, HandsOn } from "./handson/HandsOn";
import { TIMERS_TOTAL, TimerTest } from "./timers/TimerTest";
import { TimerThumb } from "./timers/TimerThumbs";
import { SD_TOTAL, StructuredVsTodoist } from "./versus/structured-todoist/StructuredVsTodoist";
import { FH_TOTAL, FinchVsHabitica } from "./versus/finch-habitica/FinchVsHabitica";
import { DK_TOTAL, TodoistVsTickTick } from "./versus/todoist-ticktick/TodoistVsTickTick";
import { GT_TOTAL, GoblinVsTiimo } from "./versus/goblin-tiimo/GoblinVsTiimo";
import { TT_TOTAL, TiimoVsTickTick } from "./versus/tiimo-ticktick/TiimoVsTickTick";
import { TD_TOTAL, TiimoVsTodoist } from "./versus/tiimo-todoist/TiimoVsTodoist";
import { PlannerThumb, UnstuckThumb } from "./unstuck/Thumbs";
import { KITCHEN_TOTAL, KitchenExplainer } from "./talkinghead/kitchen/Kitchen";
import { KITCHEN2_TOTAL, Kitchen2 } from "./talkinghead/kitchen2/Kitchen2";
import { CafeVlog, VLOG_TOTAL } from "./vlog/CafeVlog";

// Placeholder; carousel/build.js always passes a real spec via inputProps
const SAMPLE_SPEC: Spec = { slug: "sample", slides: [{ layout: "final-phone", id: "x", photo: "../hook", lines: ["sample"], ask: "sample" }] };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BestAdhdPlannerApps"
        component={BestPlannerApps}
        durationInFrames={TOTAL}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AppDemo"
        component={AppDemo}
        durationInFrames={DEMO_TOTAL}
        fps={DEMO_FPS}
        width={1080}
        height={1920}
      />
      {CUTS.map((c) => (
        <Composition key={c.id} id={c.id} component={ClipDemo} defaultProps={{ id: c.id }} durationInFrames={cutTotal(c)} fps={CLIP_FPS} width={1080} height={1920} />
      ))}
      <Composition id="PlannerReview" component={PlannerReview} durationInFrames={PR_TOTAL} fps={PR_FPS} width={1920} height={1080} />
      <Composition id="TodoReview" component={TodoReview} durationInFrames={TR_TOTAL} fps={30} width={1920} height={1080} />
      {(["A", "B", "C", "D"] as const).map((v) => <Still key={`pt${v}`} id={`PaperThumb${v}`} component={PaperThumb} defaultProps={{ v }} width={1280} height={720} />)}
      {(["E", "F"] as const).map((v) => <Still key={`tt${v}`} id={`TimerThumb${v}`} component={TimerThumb} defaultProps={{ v }} width={1280} height={720} />)}
      <Composition id="TimerTest" component={TimerTest} durationInFrames={TIMERS_TOTAL} fps={30} width={1920} height={1080} />
      <Composition id="HandsOn" component={HandsOn} durationInFrames={HANDS_TOTAL} fps={30} width={1920} height={1080} />
      <Composition id="PaperReview" component={PaperReview} durationInFrames={PAPER_TOTAL} fps={30} width={1920} height={1080} />
      {[0, 1, 2, 3].map((n) => <Still key={`pf${n}`} id={`PaperFrame${n}`} component={PaperFrame} defaultProps={{ n }} width={1920} height={1080} />)}
      <Composition id="UnstuckRank" component={UnstuckRank} durationInFrames={UR_TOTAL} fps={UR_FPS} width={1920} height={1080} />
      <Composition id="TiimoVsStructured" component={TiimoVsStructured} durationInFrames={VS_TOTAL} fps={VS_FPS} width={1920} height={1080} />
      <Composition id="GoblinVsTiimo" component={GoblinVsTiimo} durationInFrames={GT_TOTAL} fps={VS_FPS} width={1920} height={1080} />
      <Composition id="TiimoVsTickTick" component={TiimoVsTickTick} durationInFrames={TT_TOTAL} fps={VS_FPS} width={1920} height={1080} />
      <Composition id="FinchVsHabitica" component={FinchVsHabitica} durationInFrames={FH_TOTAL} fps={VS_FPS} width={1920} height={1080} />
      <Composition id="TodoistVsTickTick" component={TodoistVsTickTick} durationInFrames={DK_TOTAL} fps={VS_FPS} width={1920} height={1080} />
      <Composition id="StructuredVsTodoist" component={StructuredVsTodoist} durationInFrames={SD_TOTAL} fps={VS_FPS} width={1920} height={1080} />
      <Composition id="GoblinVsChatGPT" component={GoblinVsChatGPT} durationInFrames={GC_TOTAL} fps={VS_FPS} width={1920} height={1080} />
      <Composition id="StuckToStarted" component={StuckToStarted} durationInFrames={STS_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="StoryReel" component={StoryReel} durationInFrames={STORY_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="TalkingHeadKitchen" component={KitchenExplainer} durationInFrames={KITCHEN_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="CafeVlog" component={CafeVlog} durationInFrames={VLOG_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="TalkingHeadKitchen2" component={Kitchen2} durationInFrames={KITCHEN2_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="FocoRigTest" component={RigTest} durationInFrames={RIG_TEST_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="SmartAdhdA" component={SmartAdhdA} durationInFrames={SMART_TOTAL} fps={30} width={1080} height={1920} />
      <Still id="WeirdlyThumbA" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "listreels/weirdlygood/A/a03", bg: "#161c37", dy: 330, kicker: "PEOPLE WITH ADHD ARE", big: "WEIRDLY", sub: "productive", tag: "be honest" }} />
      <Still id="WeirdlyThumbB" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "listreels/weirdlygood/B/b03", bg: "#436c80", dy: 330, kicker: "PEOPLE WITH ADHD ARE", big: "WEIRDLY", sub: "productive", tag: "be honest" }} />
      <Composition id="WeirdlyGoodA" component={WeirdlyGoodA} durationInFrames={WEIRDLY_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="WeirdlyGoodB" component={WeirdlyGoodB} durationInFrames={WEIRDLY_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="CareMoreA" component={CareMoreA} durationInFrames={CARE_TOTAL} fps={30} width={1080} height={1920} />
      <Still id="CareThumbA" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "listreels/caremore/A/a02", bg: "#2b2147", dy: 120, kicker: "THE MORE YOU", big: "CARE", sub: "the harder it is to start" }} />
      <Composition id="SmartFlowA" component={SmartFlowA} durationInFrames={SMART_FLOW_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="SmartFlowB" component={SmartFlowB} durationInFrames={SMART_FLOW_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="SmartAdhdB" component={SmartAdhdB} durationInFrames={SMART_TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="ParalysisReel" component={ParalysisReel} durationInFrames={PL_TOTAL} fps={PL_FPS} width={1080} height={1920} />
      <Composition id="WaitingReel" component={WaitingReel} durationInFrames={WAITING_TOTAL} fps={PL_FPS} width={1080} height={1920} />
      <Composition id="BeforeStartReel" component={BeforeStartReel} durationInFrames={BEFORE_TOTAL} fps={PL_FPS} width={1080} height={1920} />
      <Composition id="TranslatorReel" component={TranslatorReel} durationInFrames={TRANSLATOR_TOTAL} fps={PL_FPS} width={1080} height={1920} />
      <Composition id="WomenReel" component={WomenReel} durationInFrames={WOMEN_TOTAL} fps={PL_FPS} width={1080} height={1920} />
      <Composition id="WinsReel" component={WinsReel} durationInFrames={WINS_TOTAL} fps={PL_FPS} width={1080} height={1920} />
      <Still id="WaitingThumb" component={WaitingThumb} width={1080} height={1920} />
      <Still id="BeforeStartThumb" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "listreels/beforestart/b2", dy: 200, kicker: "BEFORE I START 1 TASK", big: "THE RITUAL", sub: "coffee. desk. playlist.", tag: "be honest" }} />
      <Still id="TranslatorThumb" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "listreels/translator/t1", dy: 60, kicker: "ADHD", big: "TO ENGLISH", sub: "a translation guide", tag: "which one is you?" }} />
      <Still id="WomenThumb" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "listreels/women/q7", dy: 60, kicker: "ADHD IN WOMEN", big: "LOOKS FINE", sub: "until you look closer", tag: "tag her" }} />
      <Still id="WinsThumb" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "listreels/wins/s1", dy: 60, kicker: "SMALL ADHD WINS", big: "THAT COUNT", sub: "starting is the win", tag: "drop yours" }} />
      <Still id="ParalysisThumbA" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "paralysis/s3", dy: 140, scale: 1.08, kicker: "THIS ISN'T", big: "LAZY", sub: "it's ADHD paralysis", tag: "sound familiar?" }} />
      <Still id="ParalysisThumbB" component={ReelThumb} width={1080} height={1920} defaultProps={{ img: "paralysis/s1", dy: 160, scale: 1.08, kicker: "ADHD PARALYSIS", big: "≠ LAZY", sub: "here's what it looks like" }} />
      <Composition id="TiimoVsTodoist" component={TiimoVsTodoist} durationInFrames={TD_TOTAL} fps={VS_FPS} width={1920} height={1080} />
      {(["A", "B", "C"] as const).map((v) => <Still key={`vs${v}`} id={`VsThumb${v}`} component={VsThumb} defaultProps={{ variant: v }} width={1280} height={720} />)}
      {(["A", "B", "C"] as const).map((v) => <Still key={`td${v}`} id={`TdThumb${v}`} component={VsThumb} defaultProps={{ variant: v, l: TIIMO, r: TODOIST, score: [2, 3] as [number, number], scoreText: "TIME OR TASKS?" }} width={1280} height={720} />)}
        {(["A", "B", "C"] as const).map((v) => <Still key={`tt${v}`} id={`TtThumb${v}`} component={VsThumb} defaultProps={{ variant: v, l: TIIMO, r: TICKTICK, score: [2, 2] as [number, number], scoreText: "PICK BY PROBLEM" }} width={1280} height={720} />)}
        {(["A", "B", "C"] as const).map((v) => <Still key={`gt${v}`} id={`GtThumb${v}`} component={VsThumb} defaultProps={{ variant: v, l: GOBLIN, r: TIIMO, score: [2, 3] as [number, number], scoreText: "STUCK NOW? GOBLIN" }} width={1280} height={720} />)}
        {(["A", "B", "C"] as const).map((v) => <Still key={`fh${v}`} id={`FhThumb${v}`} component={VsThumb} defaultProps={{ variant: v, l: FINCH, r: HABITICA, score: [2, 2] as [number, number], scoreText: "GENTLE OR GAME?" }} width={1280} height={720} />)}
        {(["A", "B", "C"] as const).map((v) => <Still key={`dk${v}`} id={`DkThumb${v}`} component={VsThumb} defaultProps={{ variant: v, l: TODOIST, r: TICKTICK, score: [2, 2] as [number, number], scoreText: "PICK BY PROBLEM" }} width={1280} height={720} />)}
        {(["A", "B", "C"] as const).map((v) => <Still key={`sd${v}`} id={`SdThumb${v}`} component={VsThumb} defaultProps={{ variant: v, l: STRUCTURED, r: TODOIST, score: [2, 3] as [number, number], scoreText: "TIME OR TASKS?" }} width={1280} height={720} />)}
        {(["A", "B", "C"] as const).map((v) => <Still key={`gc${v}`} id={`GcThumb${v}`} component={VsThumb} defaultProps={{ variant: v, l: GOBLIN, r: CHATGPT, score: [3, 2] as [number, number], scoreText: "STUCK NOW? GOBLIN" }} width={1280} height={720} />)}
        {(["A", "B", "C"] as const).map((v) => <Still key={`ur${v}`} id={`UnstuckThumb${v}`} component={UnstuckThumb} defaultProps={{ variant: v }} width={1280} height={720} />)}
      {(["A", "B", "C"] as const).map((v) => <Still key={`pr${v}`} id={`PlannerThumb${v}`} component={PlannerThumb} defaultProps={{ variant: v }} width={1280} height={720} />)}
      <Composition id="PitchFilm" component={PitchFilm} durationInFrames={P_TOTAL} fps={P_FPS} width={1920} height={1080} />
      <Composition id="StoreVSL" component={StoreVSL} durationInFrames={SV_TOTAL} fps={SV_FPS} width={1080} height={1920} />
      <Composition
        id="AppReview"
        component={AppReview}
        durationInFrames={REVIEW_TOTAL}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ShiriPromo"
        component={ShiriPromo}
        durationInFrames={SHIRI_TOTAL}
        fps={SHIRI_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Explainer"
        component={Explainer}
        durationInFrames={EXPLAINER_TOTAL}
        fps={30}
        width={1920}
        height={1080}
      />
      {(["A", "B", "C"] as const).map((v) => (
        <Still key={v} id={`Thumb${v}`} component={Thumbnail} defaultProps={{ variant: v }} width={1280} height={720} />
      ))}
      {SLIDES.map((_, i) => (
        <Still key={`slide${i}`} id={`TikTokSlide${i + 1}`} component={CarouselSlide} defaultProps={{ index: i }} width={1080} height={1920} />
      ))}
      {[...INSTEAD, null].map((_, i) => (
        <Still key={`instead${i}`} id={`InsteadSlide${i + 1}`} component={InsteadSlideView} defaultProps={{ index: i }} width={1080} height={1920} />
      ))}
      {[...TINY, null].map((_, i) => (
        <Still key={`tiny${i}`} id={`TinySlide${i + 1}`} component={TinySlideView} defaultProps={{ index: i }} width={1080} height={1920} />
      ))}
      {(["morning", "lazy", "say", "tax"] as const).flatMap((set) =>
        Array.from({ length: PAIR_SETS[set].slides.length + 2 }).map((_, i) => (
          <Still key={`${set}${i}`} id={`${set}Slide${i + 1}`} component={PairSlideView} defaultProps={{ set, index: i }} width={1080} height={1920} />
        )),
      )}
      <Still id="SpecSlide" component={SpecSlideView} defaultProps={{ spec: SAMPLE_SPEC, index: 0 }} width={1080} height={1920} />
      <Still id="SpecSlideIG" component={SpecSlideIG} defaultProps={{ spec: SAMPLE_SPEC, index: 0 }} width={1080} height={1350} />
      {(["A", "B"] as const).map((v) => (
        <Still key={`st${v}`} id={`SessionThumb${v}`} component={SessionThumb} defaultProps={{ slug: "session-typing", variant: v }} width={1280} height={720} />
      ))}
      {(["A", "B"] as const).map((v) => (
        <Still key={`vt${v}`} id={`VideoThumb${v}`} component={VideoThumb} defaultProps={{ slug: "body-doubling", variant: v }} width={1280} height={720} />
      ))}
      <Composition
        id="LongVideo"
        component={LongVideo}
        fps={LV_FPS}
        width={1920}
        height={1080}
        defaultProps={{ script: { slug: "", title: "", scenes: [] }, vo: [] } as VideoProps}
        calculateMetadata={({ props }) => ({ durationInFrames: Math.max(30, totalFrames(props.vo)) })}
      />
    </>
  );
};
