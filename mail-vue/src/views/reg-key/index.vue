<template>
  <div class="reg-key">
    <div class="header-actions">
      <Icon class="icon" icon="ion:add-outline" width="23" height="23" @click="openAdd"/>
      <div class="search">
        <el-input
            v-model="params.code"
            class="search-input"
            placeholder="输入注册码搜索"
        >
        </el-input>
      </div>
      <Icon class="icon" icon="iconoir:search" @click="search" width="20" height="20"/>
      <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh"/>
      <Icon class="icon" icon="fluent:broom-sparkle-16-regular" width="22" height="22" @click="clearNotUse"/>
    </div>

    <el-scrollbar  class="scrollbar" :style="`background: ${regKeyData.length > 0  ? '#FAFCFF;' : '#FFF'}`">
      <div class="loading" :class="regKeyLoading ? 'loading-show' : 'loading-hide'">
        <loading />
      </div>
      <div class="code-box">
        <div class="code-item" v-for="item in regKeyData">
          <div class="code-info">
            <div class="info-left">
              <div class="info-left-item">
                <span class="code" @click="copyCode(item.code)">{{item.code}}</span>
              </div>
              <div class="info-left-item">
                <div>剩余次数：</div>
                <div v-if="item.count">{{item.count}}</div>
                <el-tag v-else type="danger">已用尽</el-tag>
              </div>
              <div class="info-left-item">
                <div>权限身份：</div>
                <el-tag>{{item.roleName}}</el-tag>
              </div>
              <div class="info-left-item">
                <div>有效至期：</div>
                <div v-if="item.expireTime">{{ formatExpireTime(item.expireTime)}}</div>
                <el-tag v-else type="danger">已过期</el-tag>
              </div>
            </div>
            <div class="info-right">
              <el-dropdown class="setting">
                <Icon icon="fluent:settings-24-filled" width="21" height="21" color="#909399" />
                <template #dropdown >
                  <el-dropdown-menu>
                    <el-dropdown-item @click="copyCode(item.code)">复制</el-dropdown-item>
                    <el-dropdown-item @click="openHistory(item)">记录</el-dropdown-item>
                    <el-dropdown-item @click="deleteRegKey(item)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      <div class="empty" v-if="regKeyData.length === 0">
        <el-empty v-if="!regKeyFirst" :image-size="isMobile ? 120 : 0" description="没有任何注册码"/>
      </div>
    </el-scrollbar>
    <el-dialog v-model="showAdd" title="添加注册码">
      <div class="container">
        <el-input v-model="addForm.code" placeholder="注册码">
          <template #suffix>
            <Icon @click.stop="genCode" class="gen-code" icon="bitcoin-icons:refresh-filled" width="24" height="24" />
          </template>
        </el-input>
        <el-select v-model="addForm.roleId" placeholder="身份类型">
          <el-option v-for="item in roleList" :label="item.name" :value="item.roleId" :key="item.roleId"/>
        </el-select>
        <el-date-picker
            v-model="addForm.expireTime"
            type="date"
            placeholder="有效至期"
        />
        <el-input-number v-model="addForm.count" :min="1" :max="99999"/>
        <el-button class="btn" type="primary" @click="submit" :loading="addLoading"
        >添加
        </el-button>
      </div>
    </el-dialog>
    <el-dialog class="history-list" v-model="showRegKeyHistory" title="使用记录">
      <div class="loading" :class="historyLoading ? 'loading-show' : 'loading-hide'">
        <loading />
      </div>
      <el-table v-if="!historyLoading" :data="historyList" :fit="true" style="height: 100%" >
        <el-table-column :min-width="emailColumnWidth" property="email" label="用户" :show-overflow-tooltip="true" />
        <el-table-column :width="createTimeColumnWidth" :formatter="formatUserCreateTime" property="createTime" label="时间" fixed="right" :show-overflow-tooltip="true" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import {defineOptions, reactive, ref, watch} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {useSettingStore} from "@/store/setting.js";
import {roleSelectUse} from "@/request/role.js";
import {useRoleStore} from "@/store/role.js";
import {regKeyAdd, regKeyList, regKeyClearNotUse, regKeyDelete, regKeyHistory} from "@/request/reg-key.js";
import { getTextWidth } from "@/utils/text.js";
import dayjs from "dayjs";
import {tzDayjs} from "@/utils/day.js";

defineOptions({
  name: 'reg-key'
})

const roleStore = useRoleStore();
const settingStore = useSettingStore();
const params = reactive({
  code: '',
})

const roleList = reactive([])
const addLoading = ref(false)
const showAdd = ref(false)
const regKeyLoading = ref(true)
const regKeyFirst = ref(true)
const showRegKeyHistory = ref(false)
const historyList = reactive([])
const emailColumnWidth = ref(0)
const createTimeColumnWidth = ref(0)
const historyLoading = ref(false)
const isMobile = window.innerWidth < 1025

const addForm = reactive({
  code: '',
  count: 1,
  roleId: null,
  expireTime: null
})

const regKeyData = reactive([])

getList(true)

roleSelectUse().then(list => {
  roleList.length = 0
  roleList.push(...list)
})

watch(() => roleStore.refresh, () => {
  roleSelectUse().then(list => {
    roleList.length = 0
    roleList.push(...list)
  })
})

function openHistory(regKey) {

  historyList.length = 0
  historyLoading.value = true
  regKeyHistory(regKey.regKeyId).then(list => {

    historyList.push(...list)

    if (list.length > 0) {

      const email = list.reduce((a, b) =>
          a.email.length > b.email.length ? a : b
      ).email;

      emailColumnWidth.value = getTextWidth(email) + 30
      emailColumnWidth.value = emailColumnWidth.value < 300 ? emailColumnWidth.value : 300

      const createTime = list.reduce((a, b) =>
          a.createTime.length > b.email.createTime ? a : b
      );
      createTimeColumnWidth.value = getTextWidth(createTime) + 30
    }

  }).finally(() => {
    historyLoading.value = false
  })

  showRegKeyHistory.value = true
}

function formatUserCreateTime(regKey) {
  const createTime = tzDayjs(regKey.createTime);
  const currentYear = dayjs().year();
  const expireYear = createTime.year();

  if (expireYear === currentYear) {
    return createTime.format('M月D日 HH:mm');
  } else {
    return createTime.format('YYYY年M月D日 HH:mm');
  }
}

function formatExpireTime(expireTime) {

  expireTime = tzDayjs(expireTime);
  const currentYear = dayjs().year();
  const expireYear = expireTime.year();

  if (expireYear === currentYear) {
    return expireTime.format('M月D日');
  } else {
    return expireTime.format('YYYY年M月D日');
  }
}
function refresh() {
  params.code = null
  getList(true)
}

function search() {
  getList(true)
}

function getList(showLoading = false) {
  if (showLoading) {
    regKeyLoading.value = true
  }
  regKeyList(params).then(list => {
    regKeyData.length = 0
    regKeyData.push(...list)
    regKeyLoading.value = false
    regKeyFirst.value = false
  })
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage({
      message: '复制成功',
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage({
      message: '复制失败',
      type: 'error',
      plain: true,
    })
  }
}

function genCode() {
  addForm.code = generateRandomCode()
}

function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function clearNotUse() {
  ElMessageBox.confirm(`确认清除所有不可用的注册码?`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    regKeyClearNotUse().then(() => {
      ElMessage({
        message: '清除成功',
        type: 'success',
        plain: true,
      })
      getList()
    })
  });
}

function submit() {

  if (!addForm.code) {
    ElMessage({
      message: "注册码不能为空",
      type: "error",
      plain: true
    })
    return
  }

  if (!addForm.roleId) {
    ElMessage({
      message: "身份类型不能为空",
      type: "error",
      plain: true
    })
    return
  }

  if (!addForm.expireTime) {
    ElMessage({
      message: "有效时间不能为空",
      type: "error",
      plain: true
    })
    return
  }

  if (!addForm.count) {
    ElMessage({
      message: "使用次数不能为空",
      type: "error",
      plain: true
    })
    return
  }

  addLoading.value = true
  regKeyAdd(addForm).then(() => {
    showAdd.value = false
    resetForm()
    ElMessage({
      message: "添加成功",
      type: "success",
      plain: true
    })
    getList()
  }).finally(() => {
    addLoading.value = false
  })
}

function deleteRegKey(regKey){
  ElMessageBox.confirm(`确认删除${regKey.code}吗?`, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    regKeyDelete([regKey.regKeyId]).then(() => {
      getList()
      ElMessage({
        message: "删除成功",
        type: "success",
        plain: true
      })
    })
  });
}

function resetForm(){
  addForm.code = ''
}

function openAdd() {
  genCode()
  showAdd.value = true
}

</script>

<style scoped lang="scss">
.reg-key {
  height: 100%;
  overflow: hidden;
}

.scrollbar {
  height: calc(100% - 48px);
  position: relative;
  @media (max-width: 372px) {
    height: calc(100% - 85px);
  }
  .code-box {
    padding: 15px 15px 25px 15px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 15px;
    .code-item {
      background-color: #fff;
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      transition: all 300ms;
      padding: 15px;
      .code-info {
        display: flex;
        .info-left {
          flex: 1;
          min-width: 0;
          .info-left-item {
            display: flex;
            padding-top: 5px;
            .code {
              font-weight: bold;
              font-size: 16px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              cursor: pointer;
            }
          }

          .info-left-item:first-child {
            padding-top: 0;
          }
        }

        .info-right {
          display: flex;
          flex-direction: column;
          padding-top: 2px;
          gap: 5px;
        }
      }
    }
  }
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

:deep(.history-list.el-dialog) {
  min-height: 300px;
  width: 500px !important;
  @media (max-width: 540px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.history-list .loading {
  position: absolute;
  top: 10px;
  z-index: 0;
  background: rgba(255, 255, 255, 0);
}

:deep(.history-list .el-dialog__header) {
  padding-bottom: 5px;
}

:deep(.el-scrollbar__view) {
  height: calc(100% - 80px);
}

.loading {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 2;
}

.loading-show {
  transition: all 200ms ease 200ms;
  opacity: 1;
}

.loading-hide {
  pointer-events: none;
  transition: all 200ms;
  opacity: 0;
}

.container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

:deep(.el-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.setting {
  cursor: pointer;
}

.gen-code {
  color: #606266;
  cursor: pointer;
}

.header-actions {
  padding: 9px 15px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
  box-shadow: inset 0 -1px 0 0 rgba(100, 121, 143, 0.12);
  font-size: 18px;
  @media (max-width: 767px) {
    gap: 15px;
  }
  .search-input {
    width: min(200px, calc(100vw - 140px));
  }

  .search {
    :deep(.el-input-group) {
      height: 28px;
    }

    :deep(.el-input__inner) {
      height: 28px;
    }
  }

  .icon {
    cursor: pointer;
  }
}

:deep(.el-table__inner-wrapper:before) {
  background: #fff;
}

</style>