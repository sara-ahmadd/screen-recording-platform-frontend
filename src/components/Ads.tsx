import { useEffect, useRef } from "react";


export const Ad = () => {
    const adRef = useRef<HTMLModElement | null>(null);
  
    useEffect(() => {
      const timer = setTimeout(() => {
        try {
          if (!(window as any).adsbygoogle || !adRef.current) return;
    
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {
          console.error(e);
        }
      }, 1000); // delay is key
    
      return () => clearTimeout(timer);
    }, []);
  
    return (
        <ins ref={adRef} className="adsbygoogle"
        style={{ display: "block", minHeight: "20px" }}
        data-ad-client="ca-pub-7034676662232707"
        data-ad-slot="2452228548"
        data-ad-format="auto"
        data-adtest="on"
        data-full-width-responsive="true"></ins>
    );
  };