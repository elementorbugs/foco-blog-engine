import { Composition, Still } from "remotion";
import { BestPlannerApps, TOTAL } from "./Composition";
import { AppReview, FPS, REVIEW_TOTAL } from "./Review";
import { Explainer, EXPLAINER_TOTAL } from "./explainer/Explainer";
import { Thumbnail } from "./explainer/Thumbnail";
import { CarouselSlide, SLIDES } from "./carousel/Carousel";
import { VideoThumb } from "./video/Thumb";
import { FPS as LV_FPS, LongVideo, totalFrames, type VideoProps } from "./video/LongVideo";
import { INSTEAD, InsteadSlideView, TINY, TinySlideView } from "./carousel/MoreCarousels";
import { PairSlideView, SETS as PAIR_SETS } from "./carousel/MoreCarousels2";
import { SpecSlideIG, SpecSlideView, type Spec } from "./carousel/Spec";

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
        id="AppReview"
        component={AppReview}
        durationInFrames={REVIEW_TOTAL}
        fps={FPS}
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
