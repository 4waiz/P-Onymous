"use client";

import { Building2, Package, RotateCcw, Truck, Users, Warehouse as WarehouseIcon, Workflow } from "lucide-react";
import { useCallback } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { useGrowing, useWandering } from "@/components/world/live";
import { WorldPanel, type WorldFocusSpec } from "@/components/world/WorldPanel";
import { int, money } from "@/lib/format";
import { useAppState } from "@/lib/store";

const fmtMoney = (v: number) => money(v, 0);
const fmtInt = (v: number) => int(v);

/** The business as a live 3D city: orders, stock, revenue, vans and customers in motion. */
export function OverviewWorldPanel() {
  const { stats, transactions } = useAppState();
  const revenue = stats.revenue * 30 + useGrowing(11, 2600, 18, 96);
  const orders = 296 + transactions.filter((t) => t.direction === "out").length + Math.floor(useGrowing(12, 3400, 0.4, 1.6));
  const stock = 3420 - Math.floor(useGrowing(13, 3100, 0.5, 3));
  const picking = useWandering(14, 2800, 19, 31, 24);
  const vansOut = useWandering(15, 5200, 2, 4, 3);
  const newCustomers = 86 + Math.floor(useGrowing(16, 4800, 0.3, 1.2));
  const parcels = 32 + Math.floor(useGrowing(17, 3600, 0.2, 1.1)) % 28;
  const packed = 288 + Math.floor(useGrowing(18, 3000, 0.5, 1.5));

  const counter = useCallback((value: number, f: (v: number) => string) => <AnimatedNumber value={value} format={f} at={0.3} duration={1.4} />, []);

  const focus = useCallback(
    (id: string): WorldFocusSpec | null => {
      switch (id) {
        case "warehouse":
          return {
            title: "Stock",
            tone: "green",
            icon: <WarehouseIcon size={19} strokeWidth={1.8} />,
            rows: [
              ["Hoodies", "214"],
              ["Caps", "96"],
              ["Low stock", <span key="low" className="text-neg">3 items</span>],
            ],
          };
        case "tower":
          return {
            title: "Revenue",
            tone: "blue",
            icon: <span className="text-[17px] font-bold">$</span>,
            rows: [
              ["Today", money(revenue, 0)],
              ["Orders", int(orders)],
              ["Avg. order", money(revenue / Math.max(1, orders), 2)],
            ],
          };
        case "houses":
          return {
            title: "Customers",
            tone: "purple",
            icon: <Users size={18} strokeWidth={1.8} />,
            rows: [
              ["Active today", int(1251 + newCustomers - 86)],
              ["New today", `+${newCustomers}`],
              ["Repeat rate", "40%"],
            ],
          };
        case "van":
          return {
            title: "Van 03",
            tone: "coral",
            icon: <Truck size={18} strokeWidth={1.8} />,
            rows: [
              ["Parcels", `${parcels} / 60`],
              ["Next stop", "3 min"],
              ["Driver", "Rafiq A."],
            ],
          };
        case "conveyor":
          return {
            title: "Picking line",
            tone: "amber",
            icon: <Workflow size={18} strokeWidth={1.8} />,
            rows: [
              ["Picking", `${picking} / hr`],
              ["Packed today", int(packed)],
              ["Queue", `${Math.max(3, 40 - picking)} orders`],
            ],
          };
        case "pallets":
          return {
            title: "Inbound",
            tone: "green",
            icon: <Package size={18} strokeWidth={1.8} />,
            rows: [
              ["Pallets", "2 arriving"],
              ["Units", "+640"],
              ["ETA", "14:30"],
            ],
          };
        case "depot":
          return {
            title: "Returns",
            tone: "purple",
            icon: <RotateCcw size={18} strokeWidth={1.8} />,
            rows: [
              ["Returns", "12"],
              ["Refunded", money(1180, 0)],
              ["Restocked", "9"],
            ],
          };
        case "parking":
          return {
            title: "Fleet",
            tone: "coral",
            icon: <Building2 size={18} strokeWidth={1.8} />,
            rows: [
              ["Vans out", `${vansOut} / 4`],
              ["Charging", `${4 - vansOut}`],
              ["On-time", "97%"],
            ],
          };
        default:
          return null;
      }
    },
    [newCustomers, orders, packed, parcels, picking, revenue, vansOut],
  );

  return (
    <WorldPanel
      scene="overview"
      eyebrow="Business"
      at={0.12}
      focus={focus}
      cards={[
        { id: "orders", anchor: "warehouse", side: "left", tone: "blue", label: "Orders today", value: counter(orders, fmtInt) },
        { id: "stock", anchor: "pallets", side: "left", tone: "green", label: "Stock", value: <>{counter(stock, fmtInt)} <span className="text-[14px] font-semibold">units</span></> },
        { id: "picking", anchor: "conveyor", side: "left", tone: "amber", label: "Picking", value: `${picking} / hr` },
        { id: "revenue", anchor: "tower", side: "right", tone: "blue", label: "Revenue today", value: counter(revenue, fmtMoney) },
        { id: "vans", anchor: "van", side: "right", tone: "coral", label: "Vans out", value: `${vansOut} / 4` },
        { id: "customers", anchor: "houses", side: "right", tone: "purple", label: "New customers", value: `+${newCustomers}` },
      ]}
    />
  );
}
