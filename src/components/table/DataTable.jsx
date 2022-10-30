import { defineComponent, ref, watch } from 'vue'
import { vExec } from '../route/Create'
import { getUrl, request, searchQuick } from '../../utils/request'
import { event, requestEvent } from '../../utils/event'
import { router } from '../../utils/router'

export default defineComponent({
  props: {
    url: {
      type: String,
      default: () => window.location.href
    },
    urlBind: {
      type: Boolean,
      default: false
    },
    defaultData: Object,
    editUrl: {
      type: String,
      default: ''
    },
    columns: {
      type: Array,
      default: () => []
    },
    filter: {
      type: Object,
      default: () => ({})
    },
    nParams: {
      type: Object,
      default: () => ({})
    },
    select: {
      type: Boolean,
      default: false
    },
    simple: {
      type: Boolean,
      default: false
    },
    limit: {
      type: Number,
      default: 20
    },
    requestEventName: {
      type: String,
      default: null
    },
    nowrap: {
      type: Boolean,
      default: false
    },
    columnsData: {
      type: Object,
      default: () => ({})
    }
  },
  watch: {
    defaultData(val) {
      val instanceof Array && (this.data = this.formatData(val))
    }
  },
  setup(props) {

      // format data
    const formatData = (data, replaceKeys = props.columns.filter(v => v.replace)) => {
      return data.map(item => {
        item.__loading = false
          // replace keys
        if (replaceKeys.length) {
          replaceKeys.forEach(v => {
            item[v.dataIndex] = item[v.dataIndex].replace(v.replace, '')
          })
        }
        if (item.children) {
          item.children = formatData(item.children, replaceKeys);
        }
        return item
      })
    }

      // selected column
      const checkedRowKeys = ref([])
      // list data
      const data = ref(formatData(props.defaultData || []))
      // sort field
      const sort = ref({})

      // number of selected rows
      const checkRow = () => checkedRowKeys.value.length

      /**
       * Default batch operation method
       * @param {*} option
       * @param {*} title
       * @param {*} type
       */
    const checkAction = (option, title, type = 'warning') => {
      if (!checkedRowKeys.value.length) {
        window.message.warning('Please select an item before proceeding！')
        return
      }
      const callback = () => {
        if (typeof option === 'string') {
          option = {
            url: option,
            method: 'POST'
          }
        }
        if (!option.data?.ids) {
          if (typeof option.data === 'undefined') {
            option.data = {}
          }
          option.data.ids = checkedRowKeys.value
        }
        if (!option.method) {
          option.method = 'POST'
        }
        if (!option.urlType) {
          option.urlType = 'absolute'
        }
        if (typeof option.successMsg === 'undefined') {
          option.successMsg = true
        }
        request(option).then(getList)
      }
      if (title) {
        window.dialog[type]({
          title: 'Operation reminder',
          content: title,
          hideCancel: false,
          onOk: callback
        })
      } else {
        callback()
      }

    }

    const pagination = ref({
      showTotal: !props.simple,
      showJumper: !props.simple,
      showPageSize: !props.simple,
      simple: props.simple,
      total: 0,
      current: 1,
      pageSize: props.limit,
      onChange: page => {
        pagination.value.current = page
        getList(props.filter)
      },
      onPageSizeChange: limit => {
        pagination.value.pageSize = limit
        pagination.value.current = 1
        getList(props.filter)
      }
    })

      // loading display
    const loading = ref(false)

      // get the list
    const getList = (params = {}) => {
      if (props.defaultData) {
        return
      }
      loading.value = true
      searchQuick({
        url: getUrl(props.url),
        data: {
          ...params,
          _sort: sort.value,
          page: pagination.value.current,
          limit: pagination.value.pageSize
        }
      }, 'data-table').then(res => {
        pagination.value.total = res.total
        pagination.value.pageSize = res.pageSize
        data.value = formatData(res.data)
        loading.value = false
      }).catch(() => {
        loading.value = false
      })
    }

      // data bound to the page slot
    const childData = {
      checkedRowKeys,
      checkRow,
      getList,
      checkAction
    }

    const loopData = (key, callback, list = data.value, parent = null) => {
      list.some((item, index, arr) => {
        if (item[props.nParams['row-key']] == key) {
          item.__loading = false;
          callback(item, index, arr, parent);
          return true;
        }
        if (item.children) {
          return loopData(key, callback, item.children, item);
        }
        return false;
      });
    }

    const requestEventCallBack = res => {
      if (!res) {
        return
      }
      if (!Array.isArray(res)) {
        res = [res]
      }
      res.forEach(action => {
        if (action.data) {
          action.data = formatData([action.data])[0]
        }
        // 新增数据到顶级
        if (action.type === 'add' && !action.parentKey) {
          data.value[action.pos === 'end' ? 'push' : 'unshift'](action.data)
          return
        }
        loopData(
          action.type === 'add' ? action.parentKey : action.key,
          (item, index, arr) => {
            switch (action.type) {
              case 'edit': {
                arr[index] = action.data
                if (!arr[index].children?.length && item.children) {
                  arr[index].children = item.children
                }
                break
              }
              case 'add': {
                if (!item.children) {
                  item.children = []
                }
                item.children[action.pos === 'end' ? 'push' : 'unshift'](action.data)
                pagination.value.total += 1
                break
              }
              case 'del': {
                arr.splice(index, 1)
                pagination.value.total -= 1
                break
              }
              default: {
                break
              }
            }
          }
        )

      })
    }

      // request event listener to update data
    if (props.requestEventName) {
      requestEvent.add(props.requestEventName, requestEventCallBack)
    }


    /**
     * Methods of external control data
     */
    const tableAction = (type, data) => {
      switch (type) {
        case 'reload': {
          getList(props.filter)
          break
        }
        case 'to-page': {
          pagination.value.current = +data
          getList(props.filter)
          break
        }
        default: {

        }
      }
    }

    if (props.requestEventName) {
      event.add('table-action-' + props.requestEventName, tableAction)
    }

    const routerChange = ({ params, agree }) => {
      // Parameter changes reset to the first page
      if (agree === 'routerPush') {
        pagination.value.current = 1
        getList(params)
      }
    }

    // url automatically follows parameters
    if (props.urlBind) {
      // Listen to routing parameter changes and re-fetch list data
      event.add('router-change', routerChange)

      // monitor filter
      watch(props.filter, params => {
        // Filter empty parameters and jump to the routing address of this proxy parameter
        router.routerPush(void 0, Object.fromEntries(Object.keys(params).filter(key => params[key] !== null).map(key => [key, params[key]])))
      })

      // Jump to the default filter option by default
      router.routerPush(void 0, Object.fromEntries(Object.keys(props.filter).filter(key => props.filter[key] !== null).map(key => [key, props.filter[key]])))
    } else {
      watch(props.filter, params => {
        // Jump to the first page
        pagination.value.current = 1
        // Filter empty parameters and jump to the routing address of this proxy parameter
        getList(params)
      })
      getList(props.filter)
    }

    // sort
    const sorter = (key, order) => {
      if (!order) {
        sort.value = {}
      } else {
        sort.value = {}
        sort.value[key] = order === 'ascend' ? 'asc' : 'desc'
      }
      getList(props.filter)
    }

    const editStatus = ref({
      status: false
    })

    // Default modify data method
    const editValue = (url = this.editUrl, data, index) => {
      if (editStatus.value.status) {
        return
      }
      editStatus.value = {
        status: true,
        data,
        index
      }
      request({
        url,
        urlType: 'absolute',
        method: 'post',
        data
      }).finally(() => {
        editStatus.value = {
          status: false
        }
      })
    }

    const colSortable = {
      sortDirections: ['ascend', 'descend'],
    }

    const columns = props.columns.map(item => vExec.call({ colSortable, columnsData: props.columnsData }, item, { editValue, editStatus }))

    return {
      formatData,
      sorter,
      pagination,
      childData,
      data,
      loading,
      columnsRender: columns,
      getList,
      routerChange,
      checkedRowKeys,
      requestEventCallBack,
      tableAction
    }
  },

  beforeUnmount() {
    event.remove('router-change', this.routerChange)
    requestEvent.remove(this.requestEventName, this.requestEventCallBack)
    event.remove('table-action-' + this.requestEventName, this.tableAction)
  },

  render() {
    return <div class="relative">
      <a-table
        loading={this.loading}
        rowSelection={this.select ? {
          type: 'checkbox',
          selectedRowKeys: this.checkedRowKeys,
          showCheckedAll: true
        } : false}
        onSelectionChange={value => {
          this.checkedRowKeys = value
        }}
        pagination={this.defaultData ? false : this.pagination}
        data={this.data}
        columns={this.columnsRender}
        onSorterChange={this.sorter}
        {...this.nParams}
      >
        {{
          tbody: () => {
            return <tbody style={this.nowrap ? { whiteSpace: 'nowrap' } : {}} />
          }
        }}
      </a-table>
      <div class="absolute bottom-0 z-10 ">
        {this.$slots.footer?.(this.childData)}
      </div>
    </div>

  }
})
