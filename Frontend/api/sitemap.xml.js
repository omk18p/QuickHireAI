export default function handler(req, res) {
  // Set the correct content type for XML
  res.setHeader('Content-Type', 'application/xml');
  
  // Set cache headers for better performance
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://quick-hire-ai.vercel.app/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://quick-hire-ai.vercel.app/login</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quick-hire-ai.vercel.app/signup</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  res.status(200).send(sitemap);
}
