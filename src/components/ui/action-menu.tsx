"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent, PopoverItem } from "./popover";
import { Button } from "./button";

export type ActionMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

type ActionMenuProps = {
  trigger?: React.ReactNode;
  items: ActionMenuItem[];
};

export function ActionMenu({ trigger, items }: ActionMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <span className="text-base leading-none">+</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent>
        {items.map((item) => (
          <PopoverItem key={item.label} onClick={item.onClick}>
            {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
            {item.label}
          </PopoverItem>
        ))}
      </PopoverContent>
    </Popover>
  );
}
