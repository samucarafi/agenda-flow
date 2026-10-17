import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dnr3p4vxf/**",
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
