// In-memory fallback for local development if KV is not bound
const memoryDb = {
  "baby-budget-plan": 10,
  "nama-kecil": 10,
  "ortupedia": 10,
  "ceritakecil": 10
};

export async function onRequestGet(context) {
  const { env } = context;
  const products = ["baby-budget-plan", "nama-kecil", "ortupedia", "ceritakecil"];
  const data = {};

  for (const prod of products) {
    if (env.CLICKS_KV) {
      const val = await env.CLICKS_KV.get(prod);
      data[prod] = val !== null ? parseInt(val, 10) : 10;
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

export async function onRequestPost(context) {
  const { env, request } = context;
  
  let product = "";
  try {
    const body = await request.json();
    product = body.product;
  } catch (e) {
    // try query param as fallback
    const url = new URL(request.url);
    product = url.searchParams.get("product");
  }

  const products = ["baby-budget-plan", "nama-kecil", "ortupedia", "ceritakecil"];
  if (!product || !products.includes(product)) {
    return new Response(JSON.stringify({ error: "Invalid product" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
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

  return new Response(JSON.stringify({ product, count: newCount }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
