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
import { SD_TOTAL, StructuredVsTodoist } from "./versus/structured-todoist/StructuredVsTodoist";
import { FH_TOTAL, FinchVsHabitica } from "./versus/finch-habitica/FinchVsHabitica";
import { DK_TOTAL, TodoistVsTickTick } from "./versus/todoist-ticktick/TodoistVsTickTick";
import { GT_TOTAL, GoblinVsTiimo } from "./versus/goblin-tiimo/GoblinVsTiimo";
import { TT_TOTAL, TiimoVsTickTick } from "./versus/tiimo-ticktick/TiimoVsTickTick";
import { TD_TOTAL, TiimoVsTodoist } from "./versus/tiimo-todoist/TiimoVsTodoist";
import { PlannerThumb, UnstuckThumb } from "./unstuck/Thumbs";

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
