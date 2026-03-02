
import React from 'react';

interface CoupangAdProps {
  id?: number;
  template?: 'banner' | 'carousel';
}

export const CoupangAd: React.FC<CoupangAdProps> = ({ id = 968153, template = 'banner' }) => {
  // 합계 보기 광고용 ID: 968136
  return (
    <div className="w-full flex items-center justify-center pointer-events-auto mb-2 overflow-hidden bg-transparent rounded-lg">
      <iframe
        srcDoc={`
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8">
            <style>
                body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;overflow:hidden;}
                #ad-container { width: 100%; display: flex; justify-content: center; }
            </style>
            </head>
            <body>
              <div id="ad-container">
                <script src="https://ads-partners.coupang.com/g.js"></script>
                <script>
                    new PartnersCoupang.G({
                        "id": ${id},
                        "template": "${template}",
                        "trackingCode": "AF9552419",
                        "width": "600",
                        "height": "110",
                        "tsource": ""
                    });
                </script>
              </div>
            </body>
          </html>
        `}
        width="100%"
        height="110"
        style={{ border: 'none', maxWidth: id === 968136 ? '100%' : '320px', display: 'block' }}
        title="Coupang Partners Ad"
        scrolling="no"
      />
    </div>
  );
};
