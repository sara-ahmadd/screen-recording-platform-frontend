import { useEffect, useRef } from "react";


export const Ad = () => {
    const adRef = useRef<HTMLModElement | null>(null);
  
    useEffect(() => {
      if (!adRef.current) return;
  
      try {
        // prevent duplicate initialization
        if ((adRef.current as any).dataset.adsbygoogleStatus === "done") {
          return;
        }
  
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }, []);
  
    return (
        <ins ref={adRef} className="adsbygoogle"
        style={{display:"block"}}
        data-ad-client="ca-pub-7034676662232707"
        data-ad-slot="2452228548"
        data-ad-format="auto"
        data-adtest="on"
        data-full-width-responsive="true"></ins>
    );
  };