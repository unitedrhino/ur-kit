import { ThingsApi } from '@vben/api';

// import { postThingsSchemaCommonIndex } from '#/api/v1/api';

export type AggColumn = {
  identifier: string;
  name: string;
  desc: string;
  children?: AggColumn[];
  dataID?: string;
  agg?: string;
  key?: string;
  noFirstTs?: boolean;
};

export type AggConfig = {
  agg: string;
  name: string;
  key: string;
  children?: AggConfig[];
  noFirstTs?: boolean;
};

export const columnHelper = () => {
  const getBaseColumns = async (categoryID: number): Promise<AggColumn[]> => {
    const commonSchemaList = await ThingsApi.postApiV1ThingsSchemaCommonIndex({
      productCategoryID: categoryID,
      productCategoryWithFather: true,
    });
    return commonSchemaList.list
      .filter((item) => item.identifier && item.name)
      .map((item) => {
        return {
          identifier: item.identifier!,
          name: item.name!,
          desc: item.desc || '',
        };
      });
  };

  const mappingColumnsByAggConfig = async (categoryID: number, columnAggConfig: AggConfig[]): Promise<AggColumn[]> => {
    const baseColumns = await getBaseColumns(categoryID);
    const processColumnRecursively = (baseColumn: AggColumn, child: AggConfig, basePrefix = ''): AggColumn => {
      const newIdentifier = basePrefix ? `${basePrefix}.${child.agg}.${child.key}` : `${baseColumn.identifier}.${child.agg}.${child.key}`;

      // const newName = `${baseColumn.name}(${child.name})`;
      const newName = `${child.name}`;
      const newDesc = baseColumn.desc ? `${baseColumn.desc} - ${child.name}` : `${child.name}`;

      const result: AggColumn = {
        identifier: newIdentifier,
        name: newName,
        desc: newDesc,
        dataID: baseColumn.identifier,
        agg: child.agg,
        key: child.key,
        noFirstTs: child.noFirstTs,
      };

      if (child.children && child.children.length > 0) {
        const childrenPrefix = basePrefix ? `${basePrefix}.children` : `${baseColumn.identifier}.children`;
        result.children = child.children.map((grandChild) => processColumnRecursively(baseColumn, grandChild, childrenPrefix));
      }

      return result;
    };

    const newColumnList = (baseColumnList: AggColumn[], aggConfig: AggConfig[]): AggColumn[] => {
      return baseColumnList.flatMap((baseColumn) => {
        if (!aggConfig || aggConfig.length === 0) {
          return [baseColumn];
        }

        // 如果只有一个aggConfig且没有children，直接扩展baseColumn
        if (aggConfig.length === 1 && aggConfig[0] && (!aggConfig[0].children || aggConfig[0].children.length === 0)) {
          return [processColumnRecursively(baseColumn, aggConfig[0])];
        }

        // 否则创建带children的结构
        const result: AggColumn = { ...baseColumn };
        result.children = aggConfig.map((aggConfigItem) => processColumnRecursively(baseColumn, aggConfigItem));
        return [result];
      });
    };

    const res = newColumnList(baseColumns, columnAggConfig);
    return res;
  };

  const baseColumns = [
    { type: 'checkbox' as const, width: 50 },
    { title: '序号', type: 'seq' as const, width: 50 },
    { field: 'node_name', title: '节点名称', sortable: true },
    { field: 'partition', title: '分区', sortable: true },
    { field: 'time_window', title: '时间窗口', sortable: true },
  ];

  const processColumn = (column: AggColumn): any => {
    if (!column.children || column.children.length === 0) {
      return {
        field: column.identifier,
        title: column.name,
        sortable: true,
      };
    }
    const children = column.children.map((child) => processColumn(child));

    return {
      title: column.name,
      children: children,
    };
  };

  //VxeColumnProps
  const getColumnsProps = (columns: AggColumn[]) => {
    const config = [...baseColumns]; // 创建baseColumns的副本，避免累加问题

    columns.forEach((column) => {
      const processedColumn = processColumn(column);
      config.push(processedColumn);
    });

    return config;
  };

  const getColumnsFlatten = (columns: AggColumn[], onlyChildren: boolean = false) => {
    let flattenColumns: AggColumn[] = [];
    const processColumn = (column: AggColumn) => {
      flattenColumns.push(column);
      if (column.children) {
        column.children.forEach(processColumn);
      }
    };
    columns.forEach(processColumn);

    if (onlyChildren) {
      flattenColumns = flattenColumns.filter((column) => {
        return !column?.children || column.children.length === 0;
      });
    }

    return flattenColumns;
  };

  return {
    getBaseColumns, //获取基础列
    mappingColumnsByAggConfig, //根据聚合配置映射列

    getColumnsProps, //获取VxeColumnProps
    getColumnsFlatten, //获取扁平化列
  };
};
