// In-memory fallback for local development if KV is not bound
const memoryDb = {
  "baby-budget-plan": 0,
  "nama-kecil": 0,
  "ortupedia": 0,
  "ceritakecil": 0
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── Route: OPTIONS /api/clicks ──────────────────────────────
    if (url.pathname === "/api/clicks" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // ── Route: GET /api/clicks ──────────────────────────────────
    if (url.pathname === "/api/clicks" && request.method === "GET") {
      const products = ["baby-budget-plan", "nama-kecil", "ortupedia", "ceritakecil"];
      const data = {};

      for (const prod of products) {
        if (env.CLICKS_KV) {
          const val = await env.CLICKS_KV.get(prod);
          data[prod] = val !== null ? parseInt(val, 10) : 0;
        } else {
          data[prod] = memoryDb[prod];
        }
      }

      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ── Route: POST /api/clicks ─────────────────────────────────
    if (url.pathname === "/api/clicks" && request.method === "POST") {
      let product = "";
      try {
        const body = await request.json();
        product = body.product;
      } catch (e) {
        product = url.searchParams.get("product");
      }

      const products = ["baby-budget-plan", "nama-kecil", "ortupedia", "ceritakecil"];
      if (!product || !products.includes(product)) {
        return new Response(JSON.stringify({ error: "Invalid product" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      let newCount = 0;
      if (env.CLICKS_KV) {
        const val = await env.CLICKS_KV.get(product);
        const current = val !== null ? parseInt(val, 10) : 0;
        newCount = current + 1;
        await env.CLICKS_KV.put(product, newCount.toString());
      } else {
        memoryDb[product] = (memoryDb[product] || 0) + 1;
        newCount = memoryDb[product];
      }

      return new Response(JSON.stringify({ product, count: newCount }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ── Route: GET /api/debug ───────────────────────────────────
    if (url.pathname === "/api/debug" && request.method === "GET") {
      const keys = Object.keys(env);
      const hasKV = typeof env.CLICKS_KV !== "undefined";
      
      return new Response(JSON.stringify({
        hasClicksKV: hasKV,
        envKeys: keys,
        message: hasKV 
          ? "KV Binding is active! Your database is connected to the Worker." 
          : "KV Binding 'CLICKS_KV' is NOT connected. Please check your Worker bindings in the Cloudflare dashboard under Settings > Bindings."
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ── Serve static assets ─────────────────────────────────────
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
