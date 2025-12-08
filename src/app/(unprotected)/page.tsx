import { ButtonLink } from '@/components/ui/ButtonLink';

export default function Page() {
  return (
    <main>
      <div className="mt-28 flex flex-col items-center sm:mt-36">
        <h1 className="px-5 text-center text-2xl sm:text-5xl">
          A community for all of the Kinetic Pack. Engage, discuss, and participate in brand events.
        </h1>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/login" size="medium">
            Get Started
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
