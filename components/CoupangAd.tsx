
import React from 'react';

export const CoupangAd = () => {
    return (
        <div className="w-full h-[50px] flex items-center justify-center pointer-events-auto mb-2 overflow-hidden bg-transparent rounded-lg">
            <iframe
                srcDoc={`
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;}</style></head>
            <body>
              <script src="https://ads-partners.coupang.com/g.js"></script>
              <script>
                new PartnersCoupang.G({"id":968153,"template":"banner","trackingCode":"AF9552419","width":"320","height":"50"});
              </script>
            </body>
          </html>
        `}
                width="100%"
                height="50"
                style={{ border: 'none', maxWidth: '320px', display: 'block' }}
                title="Coupang Partners Ad"
                scrolling="no"
            />
        </div>
    );
};
