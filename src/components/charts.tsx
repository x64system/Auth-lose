"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const data = [
  { month: "Jan", value: 120, users: 80 },
  { month: "Feb", value: 210, users: 140 },
  { month: "Mar", value: 180, users: 160 },
  { month: "Apr", value: 260, users: 190 },
  { month: "May", value: 300, users: 220 },
  { month: "Jun", value: 340, users: 260 }
];

export function StatsChart() {
  return (
    <div className="card glass h-80 p-4">
      <p className="mb-4 text-sm font-medium">Revenue, Licenses & Users</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" axisLine={false} tickLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#FFFFFF" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="users" stroke="#B5B5B5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
