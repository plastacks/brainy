import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EllipsisVertical } from "lucide-react";

const treeVariants = cva(
  "hover:before:opacity-100 before:absolute before:rounded-lg before:left-0 px-2 before:w-full before:opacity-0 before:bg-accent/70 before:h-[2rem] before:-z-10"
);

const selectedTreeVariants = cva(
  "before:opacity-100 before:bg-accent/70 text-accent-foreground"
);

interface TreeDataItem {
  id: string;
  name: string;
  icon?: any;
  selectedIcon?: any;
  openIcon?: any;
  children?: TreeDataItem[];
  actions?: React.ReactNode;
  onClick?: () => void;
}

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
  data: TreeDataItem[] | TreeDataItem;
  initialSelectedItemId?: string;
  onSelectChange?: (item: TreeDataItem | undefined) => void;
  expandAll?: boolean;
  defaultNodeIcon?: any;
  defaultOpenNodeIcon?: any;
  defaultLeafIcon?: any;
};

const TreeView = ({
  data,
  initialSelectedItemId,
  onSelectChange,
  expandAll,
  defaultLeafIcon,
  defaultNodeIcon,
  defaultOpenNodeIcon,
  className,
  ...props
}: TreeProps) => {
  const [selectedItemId, setSelectedItemId] = React.useState<
    string | undefined
  >(initialSelectedItemId);

  const handleSelectChange = React.useCallback(
    (item: TreeDataItem | undefined) => {
      setSelectedItemId(item?.id);
      if (onSelectChange) {
        onSelectChange(item);
      }
    },
    [onSelectChange]
  );

  const expandedItemIds = React.useMemo(() => {
    if (!initialSelectedItemId) {
      return [] as string[];
    }

    const ids: string[] = [];

    function walkTreeItems(
      items: TreeDataItem[] | TreeDataItem,
      targetId: string
    ) {
      if (items instanceof Array) {
        for (let i = 0; i < items.length; i++) {
          ids.push(items[i]!.id);
          if (walkTreeItems(items[i]!, targetId) && !expandAll) {
            return true;
          }
          if (!expandAll) ids.pop();
        }
      } else if (!expandAll && items.id === targetId) {
        return true;
      } else if (items.children) {
        return walkTreeItems(items.children, targetId);
      }
    }

    walkTreeItems(data, initialSelectedItemId);
    return ids;
  }, [data, expandAll, initialSelectedItemId]);

  return (
    <div className={cn("overflow-hidden relative p-2", className)}>
      <TreeItem
        data={data}
        selectedItemId={selectedItemId}
        handleSelectChange={handleSelectChange}
        expandedItemIds={expandedItemIds}
        defaultLeafIcon={defaultLeafIcon}
        defaultNodeIcon={defaultNodeIcon}
        defaultOpenNodeIcon={defaultOpenNodeIcon}
        {...props}
      />
    </div>
  );
};

type TreeItemProps = TreeProps & {
  selectedItemId?: string;
  handleSelectChange: (item: TreeDataItem | undefined) => void;
  expandedItemIds: string[];
  defaultNodeIcon?: any;
  defaultOpenNodeIcon?: any;
  defaultLeafIcon?: any;
};

const TreeItem = ({
  className,
  data,
  selectedItemId,
  handleSelectChange,
  expandedItemIds,
  defaultNodeIcon,
  defaultOpenNodeIcon,
  defaultLeafIcon,
  ...props
}: TreeItemProps) => {
  if (!(data instanceof Array)) {
    data = [data];
  }
  return (
    <div role="tree" className={className} {...props}>
      <ul className="space-y-1">
        {data.map((item) => (
          <li key={item.id}>
            {item.children ? (
              <TreeNode
                item={item}
                selectedItemId={selectedItemId}
                expandedItemIds={expandedItemIds}
                handleSelectChange={handleSelectChange}
                defaultNodeIcon={defaultNodeIcon}
                defaultOpenNodeIcon={defaultOpenNodeIcon}
                defaultLeafIcon={defaultLeafIcon}
              />
            ) : (
              <TreeLeaf
                item={item}
                selectedItemId={selectedItemId}
                handleSelectChange={handleSelectChange}
                defaultLeafIcon={defaultLeafIcon}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const TreeNode = ({
  item,
  handleSelectChange,
  expandedItemIds,
  selectedItemId,
  defaultNodeIcon,
  defaultOpenNodeIcon,
  defaultLeafIcon,
}: {
  item: TreeDataItem;
  handleSelectChange: (item: TreeDataItem | undefined) => void;
  expandedItemIds: string[];
  selectedItemId?: string;
  defaultNodeIcon?: any;
  defaultOpenNodeIcon?: any;
  defaultLeafIcon?: any;
}) => {
  const [value, setValue] = React.useState(
    expandedItemIds.includes(item.id) ? [item.id] : []
  );
  return (
    <Accordion
      type="multiple"
      value={value}
      onValueChange={(s) => setValue(s)}
      className="space-y-0"
    >
      <AccordionItem value={item.id} className="border-b-0">
        <AccordionTrigger
          className={cn(
            treeVariants(),
            selectedItemId === item.id && selectedTreeVariants(),
            "py-1 no-underline! hover:bg-muted relative"
          )}
          onClick={() => {
            handleSelectChange(item);
            item.onClick?.();
          }}
        >
          <div className="flex items-center w-full hover:[&_.tree-actions]:opacity-100 hover:[&_.tree-actions]:w-6">
            <div className="flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <TreeActionsIcon
                    className="opacity-0 w-0 transition-[width] ease-in-out tree-actions"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2" side="right">
                  {item.actions}
                </PopoverContent>
              </Popover>
              <TreeIcon
                item={item}
                isSelected={selectedItemId === item.id}
                isOpen={value.includes(item.id)}
                default={defaultNodeIcon}
                defaultOpen={defaultOpenNodeIcon}
              />
            </div>
            <span className="text-sm truncate">{item.name}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="ml-2 pl-1 border-l pb-0">
          <TreeItem
            data={item.children ? item.children : item}
            selectedItemId={selectedItemId}
            handleSelectChange={handleSelectChange}
            expandedItemIds={expandedItemIds}
            defaultLeafIcon={defaultLeafIcon}
            defaultNodeIcon={defaultNodeIcon}
            defaultOpenNodeIcon={defaultOpenNodeIcon}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const TreeLeaf = ({
  className,
  item,
  selectedItemId,
  handleSelectChange,
  defaultLeafIcon,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  item: TreeDataItem;
  selectedItemId?: string;
  handleSelectChange: (item: TreeDataItem | undefined) => void;
  defaultLeafIcon?: any;
}) => {
  return (
    <div
      className={cn(
        "flex text-left items-center py-1 before:right-1 hover:bg-muted relative",
        treeVariants(),
        className,
        selectedItemId === item.id && selectedTreeVariants()
      )}
      onClick={() => {
        handleSelectChange(item);
        item.onClick?.();
      }}
      {...props}
    >
      <div className="flex w-full justify-between items-center hover:[&_.tree-actions]:opacity-100 hover:[&_.tree-actions]:w-6">
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <TreeActionsIcon
                className="opacity-0 w-0 transition-[width] ease-in-out tree-actions"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            </PopoverTrigger>
            <PopoverContent className="w-fit p-2" side="right">
              {item.actions}
            </PopoverContent>
          </Popover>
          <TreeIcon
            item={item}
            isSelected={selectedItemId === item.id}
            default={defaultLeafIcon}
          />
          <span className="flex-grow text-sm truncate cursor-default">
            {item.name}
          </span>
        </div>
      </div>
    </div>
  );
};

const TreeIcon = ({
  item,
  isOpen,
  isSelected,
  default: defaultIcon,
  defaultOpen,
}: {
  item: TreeDataItem;
  isOpen?: boolean;
  isSelected?: boolean;
  default?: any;
  defaultOpen?: any;
}) => {
  let Icon = defaultIcon;
  if (isSelected && item.selectedIcon) {
    Icon = item.selectedIcon;
  } else if (isOpen && item.openIcon) {
    Icon = item.openIcon;
  } else if (isOpen && defaultOpen) {
    Icon = defaultOpen;
  } else if (item.icon) {
    Icon = item.icon;
  }
  return Icon ? <Icon className="h-4 w-4 shrink-0 mr-2" /> : <></>;
};

const TreeActionsIcon = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className={cn(
        "rounded bg-transparent opacity-80 hover:bg-muted hover:text-muted-foreground cursor-pointer",
        props.className
      )}
    >
      <EllipsisVertical className="h-4 w-4 shrink-0 mr-2" />
    </div>
  );
};

const TreeActionsContent = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

export { TreeView, type TreeDataItem };
