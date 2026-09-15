"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import banner from "@/assets/logo/banner.jpg";

const RestaurantWelcomeBanner = () => {
    const t = useTranslations("customerWelcome");

    return (
        <div className="relative w-full min-h-screen flex justify-center items-center overflow-hidden">
            {/* Background Image */}
            <Image
                src={banner}
                alt="Restaurant banner"
                fill
                className="object-cover"
                priority
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/55" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">
                    {t("welcome")}
                </h1>
                <h2 className="text-3xl sm:text-4xl font-semibold text-yellow-500 mb-8">
                    Y-PoS Restaurant
                </h2>
                <Link
                    href={"/auth/select-order-type"}
                    className="flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-all shadow-lg text-sm sm:text-base"
                >
                    <UtensilsCrossed size={18} />
                    {t("startOrder")}
                </Link>
            </div>
        </div>
    );
};

export default RestaurantWelcomeBanner;