import { For, Show, createMemo, createResource, createSignal, onCleanup, onMount } from "solid-js"
import { styled } from 'solid-styled-components';

const WikiPage = styled.main`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  width: var(--page-width);
  max-width: 100%;
  margin: 0 auto;
`

const WikiContent = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
`

const Controls = styled.div`
  z-index: 100;
  position: sticky;
  top: 0.25rem;
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background-color: var(--surface-lighter);
  border: 1px solid var(--accent-fade);
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  transition: all 0.2s ease-in-out;

  form {
    display: flex;
    gap: 0.5rem;
    button {
      font-size: 0.9rem;
      background-color: var(--surface-lighter);
      color: var(--accent-text);
      transition: all 0.2s ease-in-out;
      &:hover {
        background-color: var(--accent);
        color: var(--accent-over);
      }
      &:disabled {
        background-color: var(--surface-darker);
        color: var(--accent-fade);
        &:hover {
          background-color: var(--surface-darker);
          color: var(--accent-fade);
        }
      }
    }
  }

  ul {
    display: flex;
    gap: 1rem;
    list-style: none;
    max-width: 100%;
    flex-wrap: wrap;
    margin: 0;
    padding: 0;
    li {
      font-size: 0.75rem;
      margin: 0;
      button {
        color: var(--accent-text);
        background-color: transparent;
      }
      button:hover {
        color: var(--accent);
        background-color: var(--surface-darker);
      }
    }
  }
`

const Cover = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--accent-fade);
  min-height: 20rem;
  text-align: center;
  margin-block: 0rem 5rem;
  padding: 2rem;

  h1 {
    color: var(--accent);
    font-size: var(--step-5);
    margin: 0;
    border: none;
  }

  .fleuron {
    font-size: var(--step-2);
    color: var(--accent-fade);
    margin: 1rem;
  }
`

const sampleArticles = [
  "Main_Page",
  "Earth",
  "Saturn",
  "India",
  "Physics",
]

const TitleInput = styled.input`
  font-size: 1.25rem;
  border: 1px solid transparent;
  padding: 0.25em 0.5em;
  border-radius: 0.25em;
  background-color: transparent;
  margin: 0;
  width: 100%;
  transition: all 0.2s ease-in-out;

  &:focus,
  &:hover {
    font-size: 1rem;
    padding: 0.5em;
    border: 1px solid var(--accent-fade);
    background-color: var(--surface-darker);
  }
  &:focus {
    font-size: 1rem;
    outline: 2px solid var(--accent);
  }
`

const getWikiHtml = async (wiki: string): Promise<string> => {
  //curl https://api.wikimedia.org/core/v1/wikipedia/en/page/Earth/html
  try {
    const response = await fetch(`https://api.wikimedia.org/core/v1/wikipedia/en/page/${wiki}/html`)
    const html = await response.text()
    return html
  } catch (error) {
    console.log("Failed to fetch wiki page");
    return '<html><body><h1>Failed to fetch wiki page</h1></body></html>';
  }
}

const getImageUrl = (src: string) => {
  // console.log('Getting image url', src)
  // InputURL: //upload.wikimedia.org/wikipedia/commons/thumb/9/95/Tracy_Caldwell_Dyson_in_Cupola_ISS.jpg/250px-Tracy_Caldwell_Dyson_in_Cupola_ISS.jpg
  // We want to double the 250px to 500px, it may not always be 250px
  const url = new URL(`https:${src}`)
  const path = url.pathname
  if (src.startsWith("//upload.wikimedia.org/wikipedia/commons/thumb/")) {
    const srcLastIndex = path.lastIndexOf("/")
    const srcFileName = path.substring(srcLastIndex + 1)
    const srcFileNameParts = srcFileName.split("-")
    const srcFileNameSize = srcFileNameParts[0]
    const sizeInt = parseInt(srcFileNameSize.replace("px", ""))
    const newSrcFileName = srcFileName.replace(srcFileNameSize, `${sizeInt * 2}px`)
    const newSrc = `//upload.wikimedia.org/${path.substring(0, srcLastIndex)}/${newSrcFileName}`
    // console.log('Image', {
    //   src,
    //   path,
    //   srcFileNameParts,
    //   srcFileNameSize,
    //   newSrcFileName,
    //   newSrc
    // })
    return newSrc
  }
  return src
}


const scaledSize = (width: number): string => {
  return `calc(${width} * (var(--step-3) / 16))`
}

const parseAndImproveContent = (html: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  const body = doc.body

  // We find all the elements with mw-file-element class
  // Images are the .mw-file-element elements inside the figure with typeof="mw:File/Thumb"
  const singleImages = body.querySelectorAll("[typeof=\"mw:File/Thumb\"] .mw-file-element")
  const multiImages = body.querySelectorAll(".thumbimage [typeof=\"mw:File\"] .mw-file-element")
  const galleryImages = body.querySelectorAll(".gallerybox .mw-file-element")
  const images = Array.from(singleImages).concat(Array.from(multiImages)).concat(Array.from(galleryImages))
  // const images2 = body.querySelectorAll(".mw-file-element ")
  //
  // console.log('Images', images, imagesInFigures)

  // We iterate over all the images and change their url
  images.forEach((img) => {
    const src = img.getAttribute("src")
    if (src) {
      img.setAttribute("src", getImageUrl(src))
      // Remove srcset
      img.removeAttribute("srcset")
      // Double the width and height attributes 
      const width = img.getAttribute("width")
      const height = img.getAttribute("height")
      // console.log('Width', width, ratio, img.attributes.getNamedItem("resource")?.value)
      if (width && height) {
        const newStyle = `width: ${scaledSize(parseFloat(width))}; height: ${scaledSize(parseFloat(height))};`
        img.setAttribute("style", newStyle)
        // Remove the width and height attributes
        img.removeAttribute("width")
        img.removeAttribute("height")
        img.setAttribute("data-xyprocessed", "true")
        img.setAttribute("original-width", width)
        img.setAttribute("original-height", height)
      }
    }
  })

  const thumb = body.querySelectorAll(".gallerybox .thumb");
  const gallerybox = body.querySelectorAll(".gallerybox");

  console.log('Thumbs', thumb, gallerybox)
  Array.from(thumb).concat(Array.from(gallerybox)).forEach((t) => {
    if (t.hasAttribute("style") && t.getAttribute("style")!.includes("width")) {
      const imageInsidet = t.querySelector("img")
      if (imageInsidet) {
        const imageWidth = imageInsidet.getAttribute("original-width")
        // Set imagewidth as style of t
        if (imageWidth) {
          const newStyle = `width: ${scaledSize(parseFloat(imageWidth))};`
          t.setAttribute("style", newStyle)
        }
      }
      // 
    }
  });





  // We also need to double the width and heights of .thumbinner.multiimageinner containers
  // The width is set in the style attribute inline
  // const multiImageInners = body.querySelectorAll(".thumbinner.multiimageinner")
  // console.log('Multi image inners', multiImageInners)
  // multiImageInners.forEach((inner) => {
  //   const style = inner.getAttribute("style")
  //   if (style) {
  //     // double style
  //     const newStyle = doubleStyleWidth(style)

  //     if (newStyle[1]) {
  //       // inner.setAttribute("style", newStyle[0])
  //       inner.setAttribute("data-xyprocessed", "true")
  //       const tsingles = inner.querySelectorAll(".tsingle");

  //       tsingles.forEach((tsingle) => {
  //         // Double style
  //         const tsingleStyle = tsingle.getAttribute("style")
  //         if (tsingleStyle) {
  //           const newTsingleStyle = doubleStyleWidth(tsingleStyle)
  //           if (newTsingleStyle[1]) {
  //             tsingle.setAttribute("style", newTsingleStyle[0])
  //             console.log('Doubling', tsingle, tsingleStyle, newTsingleStyle)
  //           }
  //         }
  //       })
  //     }
  //   }
  // })

  return {
    content: doc.body.innerHTML,
    title: doc.title
  }
}

export const Wiki = () => {
  const [wiki, setWiki] = createSignal<string>("Ablation")

  const [wikiHtml, { refetch }] = createResource(() => getWikiHtml(wiki()));

  const onSubmit = (e: Event) => {
    e.preventDefault();
    refetch();
  }
  const clickRemapper = (e: MouseEvent) => {
    const target = e.target as HTMLAnchorElement
    console.log('Clicked', target)
    if (target.tagName === 'A' && target.href && target.href.includes('/wiki/') && target.target !== '_blank') {
      e.preventDefault();
      const oldHref = target.href
      // Strip the end of the /wiki/ and only keep the part after /wiki/
      const newHref = oldHref.substring(oldHref.indexOf('/wiki/') + 6)
      console.log('Old href', oldHref)
      setWiki(newHref)
      console.log('Navigat to', newHref)
      refetch()
    }
  }
  onMount(() => {
    // Attach navigation listener to prevent page change when clicking on links begining with ./
    if (document)
      document.addEventListener('click', clickRemapper)
  })

  onCleanup(() => {
    if (document)
      document.removeEventListener('click', clickRemapper)
  })

  const wikiDomContent = createMemo(() => {
    console.log('Extracting content from wiki html')
    if (!wikiHtml()) {
      return {
        content: "Loading...",
        title: "Loading..."
      }
    }
    return parseAndImproveContent(wikiHtml()!)
  })

  return (
    <WikiPage>
      <Controls>
        <form onSubmit={onSubmit}>
          <TitleInput type="text" onChange={
            (e) => setWiki((e.target as HTMLInputElement).value)
          } value={wiki()}></TitleInput>
          <button type="submit" disabled={wikiHtml.loading}>
            {wikiHtml.loading ? "Loading..." : "Search"}
          </button>
        </form>

        <ul>
          <For each={sampleArticles}>{(page) => (
            <li>
              <button onClick={() => { setWiki(page); refetch() }}>{page}</button>
            </li>
          )}
          </For>
        </ul>
      </Controls>

      <Show when={wikiHtml.loading}>
        <Cover>
          <h1>Loading...</h1>
        </Cover>
      </Show>
      <Show when={!wikiHtml.loading && !wikiHtml.error && wikiDomContent().content !== "Loading..."}>
        <Cover>
          <h1>{wikiDomContent().title}</h1>
          <div class="fleuron">❧</div>
          <p><a href={`https://en.wikipedia.org/wiki/${wiki()}`} target="_blank">Wikipedia</a></p>
        </Cover>

        <WikiContent>
          <div innerHTML={wikiDomContent().content}></div>
        </WikiContent>
      </Show>
    </WikiPage>
  )
}
