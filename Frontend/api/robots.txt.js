export default function handler(req, res) {
  // Set the correct content type for text
  res.setHeader('Content-Type', 'text/plain');
  
  // Set cache headers for better performance
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap location
Sitemap: https://quick-hire-ai.vercel.app/sitemap.xml`;

  res.status(200).send(robotsTxt);
}
