import { For, createSignal, onCleanup, onMount } from "solid-js";

type Heading = {
  depth: number;
  slug: string;
  text: string;
}

interface SideNavProps {
  headings: Heading[];
}

const formatText = (text: string) => {
  if (text.startsWith("CHAPTER")) {
    return text.replace("CHAPTER", "");
  } else return text;
}

export const SideNav = (props: SideNavProps) => {
  const [isFaded, setIsFaded] = createSignal(false);

  const [timeoutID, setTimeoutID] = createSignal(0);

  onMount(() => {
    setTimeoutID(setTimeout(() => {
      FadeNav();
    }, 10000));
  });

  const FadeNav = () => {
    setIsFaded(true);
  }

  onCleanup(() => {
    if (timeoutID()) clearTimeout(timeoutID());
  });

  return (
    <nav
      classList={{
        "faded": isFaded(),
      }}
      onMouseEnter={() => setIsFaded(false)}
      onMouseLeave={() => FadeNav()}
    >
      <div><strong>Table of Contents</strong></div>
      <ul>
        <For each={props.headings}>
          {(heading) => (
            <li>
              <a href={`#${heading.slug}`}>{formatText(heading.text)}</a>
            </li>
          )}
        </For>
      </ul>
    </nav>
  )
}
