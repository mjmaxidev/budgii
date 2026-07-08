import { Composition } from 'remotion'
import { BudgiiPromo } from './BudgiiPromo'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BudgiiPromo"
        component={BudgiiPromo}
        durationInFrames={1350}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
