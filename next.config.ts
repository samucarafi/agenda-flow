import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dnr3p4vxf/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // O limite padrão do Next.js é 1 MB. O upload do cardápio aceita até 5 MB.
      bodySizeLimit: "5mb",
    },
  },
  reactCompiler: true,
};

export default nextConfig;
