// In-memory fallback for local development or if KV is not bound
const memoryDb = {
  "baby-budget-plan": 10,
  "nama-kecil": 10,
  "ortupedia": 10,
  "ceritakecil": 10
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── Handle API /api/clicks ──────────────────────────────
    if (url.pathname === "/api/clicks") {
      const products = ["baby-budget-plan", "nama-kecil", "ortupedia", "ceritakecil"];

      // CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      if (request.method === "GET") {
        const data = {};
        for (const prod of products) {
          if (env.CLICKS_KV) {
            const val = await env.CLICKS_KV.get(prod);
            data[prod] = val !== null ? parseInt(val, 10) : 10;
          } else {
            data[prod] = memoryDb[prod];
          }
        }
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      if (request.method === "POST") {
        let product = "";
        try {
          const body = await request.json();
          product = body.product;
        } catch (e) {
          product = url.searchParams.get("product");
        }

        if (!product || !products.includes(product)) {
          return new Response(JSON.stringify({ error: "Invalid product" }), {
            status: 400,
            headers: corsHeaders
          });
        }

        let newCount = 10;
        if (env.CLICKS_KV) {
          const val = await env.CLICKS_KV.get(product);
          const current = val !== null ? parseInt(val, 10) : 10;
          newCount = current + 1;
          await env.CLICKS_KV.put(product, newCount.toString());
        } else {
          memoryDb[product] = (memoryDb[product] || 10) + 1;
          newCount = memoryDb[product];
        }

        return new Response(JSON.stringify({ product, count: newCount }), { headers: corsHeaders });
      }
    }

    // ── Handle API /api/debug-env ───────────────────────────
    if (url.pathname === "/api/debug-env") {
      const keys = Object.keys(env);
      const hasKV = typeof env.CLICKS_KV !== "undefined";
      return new Response(JSON.stringify({
        envKeys: keys,
        hasClicksKV: hasKV,
        kvType: hasKV ? typeof env.CLICKS_KV : "undefined"
      }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ── Fallback to serving static assets ───────────────────
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
