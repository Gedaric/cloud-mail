<template>
  <div class="email-list-box">
    <emailScroll ref="sysEmailScroll"
                 :get-emailList="getEmailList"
                 :email-delete="sysEmailDelete"
                 :star-add="starAdd"
                 :star-cancel="starCancel"
                 :show-star="false"
                 show-user-info
                 show-status
                 actionLeft="4px"
                 :show-account-icon="false"
                 @jump="jumpContent"
                 @refresh-before="refreshBefore"
                 :type="'sys-email'"

    >
      <template #first>
        <el-input
            v-model="searchValue"
            placeholder="输入内容查询"
            class="search-input"
        >
          <template #prefix>
            <div @click.stop="openSelect">
              <el-select
                  ref="mySelect"
                  v-model="params.searchType"
                  placeholder="请选择"
                  class="select"
              >
                <el-option key="3" label="发件人" :value="'name'"/>
                <el-option key="4" label="主题" :value="'subject'"/>
                <el-option key="1" label="用户" :value="'user'"/>
                <el-option key="2" label="邮箱" :value="'account'"/>
              </el-select>
              <div style="color: #333;display: flex;">
                <span>{{ selectTitle }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-select v-model="params.type" placeholder="Select" class="status-select">
          <el-option key="1" label="全部" value="all"/>
          <el-option key="3" label="已接收" value="receive"/>
          <el-option key="2" label="已发送" value="send"/>
          <el-option key="4" label="已删除" value="delete"/>
          <el-option key="4" label="无人收件" value="noone"/>
        </el-select>
        <Icon class="icon" icon="iconoir:search" @click="search" width="20" height="20"/>
        <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-down-outline"
              v-if="params.timeSort === 0" width="28" height="28"/>
        <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-up-outline" v-else
              width="28" height="28"/>
      </template>
    </emailScroll>
  </div>
</template>

<script setup>
import {starAdd, starCancel} from "@/request/star.js";
import emailScroll from "@/components/email-scroll/index.vue"
import {computed, defineOptions, reactive, ref, watch} from "vue";
import {useEmailStore} from "@/store/email.js";
import {
  sysEmailList,
  sysEmailDelete
} from "@/request/sys-email.js";
import {Icon} from "@iconify/vue";
import router from "@/router/index.js";

defineOptions({
  name: 'sys-email'
})

const emailStore = useEmailStore();
const sysEmailScroll = ref({})
const searchValue = ref('')
const mySelect = ref()

const openSelect = () => {
  mySelect.value.toggleMenu()
}

const params = reactive({
  timeSort: 0,
  type: 'receive',
  userEmail: null,
  accountEmail: null,
  name: null,
  subject: null,
  searchType: 'name'
})


const selectTitle = computed(() => {
  if (params.searchType === 'user') return '用户'
  if (params.searchType === 'account') return '邮箱'
  if (params.searchType === 'name') return '发件人'
  if (params.searchType === 'subject') return '主题'
})

const paramsStar = localStorage.getItem('sys-email-params')
if (paramsStar) {
  const locaParams = JSON.parse(paramsStar)
  params.type = locaParams.type
  params.timeSort = locaParams.timeSort
  params.status = locaParams.status
  params.searchType = locaParams.searchType
}

watch(() => params, () => {
  localStorage.setItem('sys-email-params',JSON.stringify(params))
}, {
  deep: true
})

function refreshBefore() {
  searchValue.value = null
  params.timeSort = 0
  params.type = 'receive'
  params.userEmail = null
  params.accountEmail = null
  params.name = null
  params.subject = null
  params.searchType = 'name'
}

function search() {

  params.userEmail = null
  params.accountEmail = null
  params.name = null
  params.subject = null

  if (params.searchType === 'user') {
    params.userEmail = searchValue.value
  }

  if (params.searchType === 'account') {
    params.accountEmail = searchValue.value
  }

  if (params.searchType === 'name') {
    params.name = searchValue.value
  }

  if (params.searchType === 'subject') {
    params.subject = searchValue.value
  }

  sysEmailScroll.value.refreshList();
}

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  sysEmailScroll.value.refreshList();
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'physics'
  emailStore.contentData.showStar = false
  emailStore.contentData.showReply = false
  router.push('/content')
}


function getEmailList(emailId, size) {
  return sysEmailList({emailId, size, ...params})
}
</script>

<style scoped lang="scss">
.email-list-box {
  height: 100%;
  width: 100%;
  overflow: hidden;
}


.search {
  padding-top: 5px;
  padding-bottom: 5px;
}

.select {
  position: absolute;
  width: 40px;
  opacity: 0;
  pointer-events: none;
}

:deep(.header-actions) {
  padding-top: 8px;
  padding-bottom: 8px;
}

.search-input {

  width: min(280px,calc(100vw - 140px));
  height: 28px;
  .setting-icon {
    position: relative;
    top: 3px;
  }
}

.status-select {
  margin-bottom: 2px;
  width: 100px;
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
}

.input-with-select {
  max-width: 200px;
  border-radius: 0 4px 4px 0;
}

:deep(.input-with-select .el-input-group__append) {
  background-color: var(--el-fill-color-blank);
}

:deep(.el-select__wrapper) {
  padding: 2px 10px;
  min-height: 28px;
}

.icon {
  cursor: pointer;
}
</style>