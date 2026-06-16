// Trigger redeploy after binding CLICKS_KV in Pages Settings
export async function onRequestGet(context) {
  const { env } = context;
  const keys = Object.keys(env);
  const hasKV = typeof env.CLICKS_KV !== "undefined";
  
  return new Response(JSON.stringify({
    hasClicksKV: hasKV,
    envKeys: keys,
    message: hasKV 
      ? "KV Binding is active! Your database is connected." 
      : "KV Binding 'CLICKS_KV' is NOT connected. Please bind it in your Cloudflare Pages dashboard under Settings > Functions > KV namespace bindings, and then redeploy."
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
